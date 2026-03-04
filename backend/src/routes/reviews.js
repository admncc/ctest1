const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews — leave a review after job completion
router.post('/', authenticate, (req, res) => {
  const { job_id, reviewee_id, rating, comment } = req.body;

  if (!job_id || !reviewee_id || !rating) {
    return res.status(400).json({ error: 'Auftrag, Bewerteter und Bewertung sind erforderlich' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Bewertung muss zwischen 1 und 5 liegen' });
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(job_id);
  if (!job) return res.status(404).json({ error: 'Auftrag nicht gefunden' });
  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Bewertungen sind nur nach Abschluss möglich' });
  }

  // Verify reviewer is part of this job
  const bid = db.prepare('SELECT * FROM bids WHERE id=?').get(job.accepted_bid_id);
  const isCustomer = job.customer_id === req.user.id;
  const isCraftsman = bid && bid.craftsman_id === req.user.id;

  if (!isCustomer && !isCraftsman) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  // Customer reviews craftsman and vice versa
  if (isCustomer && Number(reviewee_id) !== bid?.craftsman_id) {
    return res.status(400).json({ error: 'Kunden können nur den Handwerker bewerten' });
  }
  if (isCraftsman && Number(reviewee_id) !== job.customer_id) {
    return res.status(400).json({ error: 'Handwerker können nur den Kunden bewerten' });
  }

  const existing = db.prepare('SELECT id FROM reviews WHERE job_id=? AND reviewer_id=?')
    .get(job_id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Du hast diesen Auftrag bereits bewertet' });

  const result = db.prepare(
    'INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES (?,?,?,?,?)'
  ).run(job_id, req.user.id, reviewee_id, rating, comment || null);

  const review = db.prepare(`
    SELECT r.*, u.name as reviewer_name
    FROM reviews r JOIN users u ON r.reviewer_id=u.id
    WHERE r.id=?
  `).get(result.lastInsertRowid);

  res.status(201).json(review);
});

// GET /api/reviews/user/:id — all reviews for a user
router.get('/user/:id', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, j.title as job_title
    FROM reviews r
    JOIN users u ON r.reviewer_id=u.id
    JOIN jobs j ON r.job_id=j.id
    WHERE r.reviewee_id=?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  const stats = db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE reviewee_id=?'
  ).get(req.params.id);

  res.json({ reviews, avg: stats.avg, count: stats.count });
});

module.exports = router;
