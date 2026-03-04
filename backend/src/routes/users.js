const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id  — public profile
router.get('/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, name, role, location, bio, phone, avatar, created_at FROM users WHERE id = ?'
  ).get(req.params.id);

  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  let profile = null;
  if (user.role === 'craftsman') {
    profile = db.prepare('SELECT * FROM craftsman_profiles WHERE user_id = ?').get(user.id);
    if (profile) profile.specializations = JSON.parse(profile.specializations || '[]');
  }

  const ratingData = db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE reviewee_id = ?'
  ).get(user.id);

  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    WHERE r.reviewee_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all(user.id);

  res.json({ ...user, profile, rating: ratingData.avg, reviewCount: ratingData.count, reviews });
});

// PUT /api/users/me  — update own profile
router.put('/me', authenticate, (req, res) => {
  const { name, location, bio, phone } = req.body;

  db.prepare('UPDATE users SET name=?, location=?, bio=?, phone=? WHERE id=?')
    .run(name, location || null, bio || null, phone || null, req.user.id);

  if (req.user.role === 'craftsman') {
    const { specializations, hourly_rate, service_radius } = req.body;
    db.prepare(
      'UPDATE craftsman_profiles SET specializations=?, hourly_rate=?, service_radius=? WHERE user_id=?'
    ).run(
      JSON.stringify(Array.isArray(specializations) ? specializations : []),
      hourly_rate || null,
      service_radius || 50,
      req.user.id
    );
  }

  const user = db.prepare(
    'SELECT id, email, name, role, location, bio, phone, avatar, created_at FROM users WHERE id=?'
  ).get(req.user.id);

  let profile = null;
  if (user.role === 'craftsman') {
    profile = db.prepare('SELECT * FROM craftsman_profiles WHERE user_id=?').get(user.id);
    if (profile) profile.specializations = JSON.parse(profile.specializations || '[]');
  }

  res.json({ ...user, profile });
});

// GET /api/users/:id/jobs — public jobs list of a user
router.get('/:id/jobs', (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, c.name as category_name, c.icon as category_icon,
           (SELECT COUNT(*) FROM bids WHERE job_id = j.id) as bid_count
    FROM jobs j
    LEFT JOIN categories c ON j.category_id = c.id
    WHERE j.customer_id = ?
    ORDER BY j.created_at DESC
  `).all(req.params.id);
  res.json(jobs);
});

module.exports = router;
