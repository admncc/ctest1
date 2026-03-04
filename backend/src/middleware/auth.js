const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'handwerker_secret_change_in_production';

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Ungültiger Token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  const db = require('../db/database');
  const user = db.prepare('SELECT is_admin, banned FROM users WHERE id=?').get(req.user?.id);
  if (!user?.is_admin) return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
  next();
}

module.exports = { authenticate, requireRole, requireAdmin, JWT_SECRET };
