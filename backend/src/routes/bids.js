const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/bids — craftsman submits a bid
router.post('/', authenticate, requireRole('craftsman'), (req, res) => {
  const { job_id, amount, message } = req.body;

  if (!job_id || !amount || !message) {
    return res.status(400).json({ error: 'Auftrag, Betrag und Nachricht sind erforderlich' });
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(job_id);
  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });
  if (job.status !== 'open') return res.status(400).json({ error: 'Auftrag ist nicht mehr offen' });

  const existing = db.prepare('SELECT id FROM bids WHERE job_id=? AND craftsman_id=?')
    .get(job_id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Du hast bereits ein Angebot abgegeben' });

  const result = db.prepare(
    'INSERT INTO bids (job_id, craftsman_id, amount, message) VALUES (?,?,?,?)'
  ).run(job_id, req.user.id, amount, message);

  const bid = db.prepare(`
    SELECT b.*, u.name as craftsman_name, u.avatar as craftsman_avatar
    FROM bids b JOIN users u ON b.craftsman_id=u.id
    WHERE b.id=?
  `).get(result.lastInsertRowid);

  res.status(201).json(bid);
});

// PUT /api/bids/:id — craftsman updates own bid (if still pending)
router.put('/:id', authenticate, requireRole('craftsman'), (req, res) => {
  const bid = db.prepare('SELECT * FROM bids WHERE id=?').get(req.params.id);
  if (!bid) return res.status(404).json({ error: 'Angebot nicht gefunden' });
  if (bid.craftsman_id !== req.user.id) return res.status(403).json({ error: 'Keine Berechtigung' });
  if (bid.status !== 'pending') return res.status(400).json({ error: 'Angebot kann nicht mehr geändert werden' });

  const { amount, message } = req.body;
  db.prepare('UPDATE bids SET amount=?, message=? WHERE id=?').run(amount, message, req.params.id);
  res.json(db.prepare('SELECT * FROM bids WHERE id=?').get(req.params.id));
});

// DELETE /api/bids/:id — craftsman withdraws bid
router.delete('/:id', authenticate, requireRole('craftsman'), (req, res) => {
  const bid = db.prepare('SELECT * FROM bids WHERE id=?').get(req.params.id);
  if (!bid) return res.status(404).json({ error: 'Angebot nicht gefunden' });
  if (bid.craftsman_id !== req.user.id) return res.status(403).json({ error: 'Keine Berechtigung' });
  if (bid.status !== 'pending') return res.status(400).json({ error: 'Angebot kann nicht mehr zurückgezogen werden' });

  db.prepare('DELETE FROM bids WHERE id=?').run(req.params.id);
  res.json({ message: 'Angebot zurückgezogen' });
});

// POST /api/bids/:id/accept — customer accepts a bid
router.post('/:id/accept', authenticate, requireRole('customer'), (req, res) => {
  const bid = db.prepare('SELECT * FROM bids WHERE id=?').get(req.params.id);
  if (!bid) return res.status(404).json({ error: 'Angebot nicht gefunden' });

  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(bid.job_id);
  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });
  if (job.customer_id !== req.user.id) return res.status(403).json({ error: 'Keine Berechtigung' });
  if (job.status !== 'open') return res.status(400).json({ error: 'Auftrag ist nicht mehr offen' });

  // Accept this bid, reject others
  db.transaction(() => {
    db.prepare("UPDATE bids SET status='accepted' WHERE id=?").run(bid.id);
    db.prepare("UPDATE bids SET status='rejected' WHERE job_id=? AND id!=?").run(bid.job_id, bid.id);
    db.prepare("UPDATE jobs SET status='in_progress', accepted_bid_id=? WHERE id=?").run(bid.id, bid.job_id);
  })();

  res.json({ message: 'Angebot angenommen', bid_id: bid.id });
});

// POST /api/bids/:id/reject — customer rejects a specific bid
router.post('/:id/reject', authenticate, requireRole('customer'), (req, res) => {
  const bid = db.prepare('SELECT * FROM bids WHERE id=?').get(req.params.id);
  if (!bid) return res.status(404).json({ error: 'Angebot nicht gefunden' });

  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(bid.job_id);
  if (!job || job.customer_id !== req.user.id) return res.status(403).json({ error: 'Keine Berechtigung' });

  db.prepare("UPDATE bids SET status='rejected' WHERE id=?").run(bid.id);
  res.json({ message: 'Angebot abgelehnt' });
});

module.exports = router;
