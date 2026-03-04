const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role, location, phone } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'E-Mail, Passwort, Name und Rolle sind erforderlich' });
  }
  if (!['customer', 'craftsman'].includes(role)) {
    return res.status(400).json({ error: 'Ungültige Rolle' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'E-Mail bereits registriert' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password, name, role, location, phone) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(email.toLowerCase(), hashed, name, role, location || null, phone || null);

  if (role === 'craftsman') {
    db.prepare('INSERT INTO craftsman_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);
  }

  const user = db.prepare('SELECT id, email, name, role, location, phone, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Falsche E-Mail oder Passwort' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Falsche E-Mail oder Passwort' });
  }

  const { password: _, ...safeUser } = user;
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, email, name, role, location, bio, phone, avatar, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  let profile = null;
  if (user.role === 'craftsman') {
    profile = db.prepare('SELECT * FROM craftsman_profiles WHERE user_id = ?').get(user.id);
    if (profile) profile.specializations = JSON.parse(profile.specializations || '[]');
  }

  // Compute rating
  const ratingData = db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE reviewee_id = ?'
  ).get(user.id);

  res.json({ ...user, profile, rating: ratingData.avg, reviewCount: ratingData.count });
});

module.exports = router;
