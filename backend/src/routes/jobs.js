const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/jobs — list with optional filters
router.get('/', (req, res) => {
  const { category, location, status = 'open', page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where = ['j.status = ?'];
  const params = [status];

  if (category) { where.push('j.category_id = ?'); params.push(category); }
  if (location) { where.push('j.location LIKE ?'); params.push(`%${location}%`); }

  const whereStr = where.join(' AND ');

  const jobs = db.prepare(`
    SELECT j.*, c.name as category_name, c.icon as category_icon,
           u.name as customer_name,
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

// GET /api/jobs/categories
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
});

// GET /api/jobs/:id
router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, c.name as category_name, c.icon as category_icon,
           u.name as customer_name, u.location as customer_location, u.avatar as customer_avatar
    FROM jobs j
    LEFT JOIN categories c ON j.category_id = c.id
    JOIN users u ON j.customer_id = u.id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });

  const bids = db.prepare(`
    SELECT b.*, u.name as craftsman_name, u.avatar as craftsman_avatar, u.location as craftsman_location,
           cp.hourly_rate, cp.verified,
           (SELECT AVG(rating) FROM reviews WHERE reviewee_id = b.craftsman_id) as craftsman_rating,
           (SELECT COUNT(*) FROM reviews WHERE reviewee_id = b.craftsman_id) as craftsman_reviews
    FROM bids b
    JOIN users u ON b.craftsman_id = u.id
    LEFT JOIN craftsman_profiles cp ON cp.user_id = b.craftsman_id
    WHERE b.job_id = ?
    ORDER BY b.created_at ASC
  `).all(req.params.id);

  res.json({ ...job, bids });
});

// POST /api/jobs — customers create jobs
router.post('/', authenticate, requireRole('customer'), (req, res) => {
  const { title, description, category_id, location, budget_min, budget_max } = req.body;

  if (!title || !description || !location) {
    return res.status(400).json({ error: 'Titel, Beschreibung und Standort sind erforderlich' });
  }

  const result = db.prepare(
    'INSERT INTO jobs (title, description, category_id, location, budget_min, budget_max, customer_id) VALUES (?,?,?,?,?,?,?)'
  ).run(title, description, category_id || null, location, budget_min || null, budget_max || null, req.user.id);

  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(job);
});

// PUT /api/jobs/:id — owner can update open job
router.put('/:id', authenticate, requireRole('customer'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });
  if (job.customer_id !== req.user.id) return res.status(403).json({ error: 'Keine Berechtigung' });
  if (job.status !== 'open') return res.status(400).json({ error: 'Nur offene Aufträge können bearbeitet werden' });

  const { title, description, category_id, location, budget_min, budget_max } = req.body;
  db.prepare(
    'UPDATE jobs SET title=?, description=?, category_id=?, location=?, budget_min=?, budget_max=? WHERE id=?'
  ).run(title, description, category_id || null, location, budget_min || null, budget_max || null, req.params.id);

  res.json(db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id));
});

// DELETE /api/jobs/:id — owner can cancel/delete open job
router.delete('/:id', authenticate, requireRole('customer'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });
  if (job.customer_id !== req.user.id) return res.status(403).json({ error: 'Keine Berechtigung' });

  db.prepare("UPDATE jobs SET status='cancelled' WHERE id=?").run(req.params.id);
  res.json({ message: 'Auftrag storniert' });
});

// POST /api/jobs/:id/complete — mark job as completed
router.post('/:id/complete', authenticate, requireRole('customer'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });
  if (job.customer_id !== req.user.id) return res.status(403).json({ error: 'Keine Berechtigung' });
  if (job.status !== 'in_progress') return res.status(400).json({ error: 'Auftrag nicht in Bearbeitung' });

  db.prepare("UPDATE jobs SET status='completed' WHERE id=?").run(req.params.id);
  res.json({ message: 'Auftrag als abgeschlossen markiert' });
});

// GET /api/jobs/mine — own jobs (for dashboard)
router.get('/mine/list', authenticate, (req, res) => {
  let jobs;
  if (req.user.role === 'customer') {
    jobs = db.prepare(`
      SELECT j.*, c.name as category_name, c.icon as category_icon,
             (SELECT COUNT(*) FROM bids WHERE job_id=j.id) as bid_count
      FROM jobs j
      LEFT JOIN categories c ON j.category_id=c.id
      WHERE j.customer_id=?
      ORDER BY j.created_at DESC
    `).all(req.user.id);
  } else {
    jobs = db.prepare(`
      SELECT j.*, c.name as category_name, c.icon as category_icon,
             b.amount as my_bid, b.status as bid_status,
             u.name as customer_name
      FROM bids b
      JOIN jobs j ON b.job_id=j.id
      LEFT JOIN categories c ON j.category_id=c.id
      JOIN users u ON j.customer_id=u.id
      WHERE b.craftsman_id=?
      ORDER BY b.created_at DESC
    `).all(req.user.id);
  }
  res.json(jobs);
});

module.exports = router;
