const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── Stats ────────────────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const users      = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const customers  = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='customer'").get().c;
  const craftsmen  = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='craftsman'").get().c;
  const banned     = db.prepare('SELECT COUNT(*) as c FROM users WHERE banned=1').get().c;
  const jobs       = db.prepare('SELECT COUNT(*) as c FROM jobs').get().c;
  const jobsOpen   = db.prepare("SELECT COUNT(*) as c FROM jobs WHERE status='open'").get().c;
  const jobsActive = db.prepare("SELECT COUNT(*) as c FROM jobs WHERE status='in_progress'").get().c;
  const jobsDone   = db.prepare("SELECT COUNT(*) as c FROM jobs WHERE status='completed'").get().c;
  const bids       = db.prepare('SELECT COUNT(*) as c FROM bids').get().c;
  const reviews    = db.prepare('SELECT COUNT(*) as c FROM reviews').get().c;
  const avgRating  = db.prepare('SELECT AVG(rating) as avg FROM reviews').get().avg;
  const messages   = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
  const categories = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;

  // Last 7 days registrations
  const newUsers7d = db.prepare(
    "SELECT COUNT(*) as c FROM users WHERE created_at >= datetime('now', '-7 days')"
  ).get().c;
  const newJobs7d = db.prepare(
    "SELECT COUNT(*) as c FROM jobs WHERE created_at >= datetime('now', '-7 days')"
  ).get().c;

  // Registrations per day (last 14 days)
  const regByDay = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM users
    WHERE created_at >= datetime('now', '-14 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all();

  // Jobs per day (last 14 days)
  const jobsByDay = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM jobs
    WHERE created_at >= datetime('now', '-14 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all();

  res.json({
    users: { total: users, customers, craftsmen, banned, newLast7d: newUsers7d },
    jobs:  { total: jobs, open: jobsOpen, active: jobsActive, completed: jobsDone, newLast7d: newJobs7d },
    bids, reviews, avgRating, messages, categories,
    charts: { regByDay, jobsByDay },
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', (req, res) => {
  const { search = '', role = '', page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where = ['1=1'];
  const params = [];

  if (search) {
    where.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (role) { where.push('u.role = ?'); params.push(role); }

  const whereStr = where.join(' AND ');

  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.location, u.is_admin, u.banned, u.created_at,
           (SELECT COUNT(*) FROM jobs  WHERE customer_id = u.id) as job_count,
           (SELECT COUNT(*) FROM bids  WHERE craftsman_id = u.id) as bid_count,
           (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) as avg_rating,
           (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as review_count
    FROM users u
    WHERE ${whereStr}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as c FROM users u WHERE ${whereStr}`).get(...params).c;

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  if (user.is_admin) return res.status(400).json({ error: 'Admins können nicht gesperrt werden' });

  const banned = user.banned ? 0 : 1;
  db.prepare('UPDATE users SET banned=? WHERE id=?').run(banned, req.params.id);
  res.json({ message: banned ? 'Benutzer gesperrt' : 'Benutzer entsperrt', banned });
});

// PUT /api/admin/users/:id/admin
router.put('/users/:id/admin', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  const is_admin = user.is_admin ? 0 : 1;
  db.prepare('UPDATE users SET is_admin=? WHERE id=?').run(is_admin, req.params.id);
  res.json({ message: is_admin ? 'Admin-Rechte vergeben' : 'Admin-Rechte entzogen', is_admin });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  if (user.is_admin) return res.status(400).json({ error: 'Admins können nicht gelöscht werden' });

  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ message: 'Benutzer gelöscht' });
});

// ─── Jobs ─────────────────────────────────────────────────────────────────────

// GET /api/admin/jobs
router.get('/jobs', (req, res) => {
  const { search = '', status = '', page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where = ['1=1'];
  const params = [];

  if (search) { where.push('(j.title LIKE ? OR j.location LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (status) { where.push('j.status = ?'); params.push(status); }

  const whereStr = where.join(' AND ');

  const jobs = db.prepare(`
    SELECT j.*, c.name as category_name, c.icon as category_icon,
           u.name as customer_name, u.email as customer_email,
           (SELECT COUNT(*) FROM bids WHERE job_id = j.id) as bid_count
    FROM jobs j
    LEFT JOIN categories c ON j.category_id = c.id
    JOIN users u ON j.customer_id = u.id
    WHERE ${whereStr}
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as c FROM jobs j WHERE ${whereStr}`).get(...params).c;

  res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// PUT /api/admin/jobs/:id/status
router.put('/jobs/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['open', 'in_progress', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Ungültiger Status' });

  const job = db.prepare('SELECT id FROM jobs WHERE id=?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });

  db.prepare('UPDATE jobs SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ message: 'Status aktualisiert' });
});

// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', (req, res) => {
  const job = db.prepare('SELECT id FROM jobs WHERE id=?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });

  db.prepare('DELETE FROM jobs WHERE id=?').run(req.params.id);
  res.json({ message: 'Auftrag gelöscht' });
});

// ─── Categories ───────────────────────────────────────────────────────────────

// GET /api/admin/categories
router.get('/categories', (req, res) => {
  const cats = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM jobs WHERE category_id = c.id) as job_count
    FROM categories c ORDER BY c.name
  `).all();
  res.json(cats);
});

// POST /api/admin/categories
router.post('/categories', (req, res) => {
  const { name, icon, slug } = req.body;
  if (!name || !icon || !slug) return res.status(400).json({ error: 'Name, Icon und Slug erforderlich' });

  const existing = db.prepare('SELECT id FROM categories WHERE slug=?').get(slug);
  if (existing) return res.status(409).json({ error: 'Slug bereits vergeben' });

  const result = db.prepare('INSERT INTO categories (name, icon, slug) VALUES (?,?,?)').run(name, icon, slug);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id=?').get(result.lastInsertRowid));
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', (req, res) => {
  const cat = db.prepare('SELECT id FROM categories WHERE id=?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Kategorie nicht gefunden' });

  const { name, icon, slug } = req.body;
  if (!name || !icon || !slug) return res.status(400).json({ error: 'Name, Icon und Slug erforderlich' });

  db.prepare('UPDATE categories SET name=?, icon=?, slug=? WHERE id=?').run(name, icon, slug, req.params.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id=?').get(req.params.id));
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', (req, res) => {
  const cat = db.prepare('SELECT id FROM categories WHERE id=?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Kategorie nicht gefunden' });

  const jobCount = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE category_id=?').get(req.params.id).c;
  if (jobCount > 0) return res.status(400).json({ error: `Kategorie hat noch ${jobCount} Aufträge` });

  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  res.json({ message: 'Kategorie gelöscht' });
});

module.exports = router;
