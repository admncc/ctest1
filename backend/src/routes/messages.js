const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations — list conversations
router.get('/conversations', authenticate, (req, res) => {
  const conversations = db.prepare(`
    SELECT
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
      u.name as other_user_name, u.avatar as other_user_avatar, u.role as other_user_role,
      m.content as last_message, m.created_at as last_message_at,
      SUM(CASE WHEN m.receiver_id=? AND m.read=0 THEN 1 ELSE 0 END) as unread_count
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id=? OR m.receiver_id=?
    GROUP BY other_user_id
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  res.json(conversations);
});

// GET /api/messages/:userId — messages with a specific user
router.get('/:userId', authenticate, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM messages m
    JOIN users u ON m.sender_id=u.id
    WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
    ORDER BY m.created_at ASC
    LIMIT 100
  `).all(req.user.id, req.params.userId, req.params.userId, req.user.id);

  // Mark as read
  db.prepare('UPDATE messages SET read=1 WHERE sender_id=? AND receiver_id=? AND read=0')
    .run(req.params.userId, req.user.id);

  res.json(messages);
});

// POST /api/messages — send a message
router.post('/', authenticate, (req, res) => {
  const { receiver_id, content, job_id } = req.body;
  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'Empfänger und Nachricht sind erforderlich' });
  }
  if (receiver_id === req.user.id) {
    return res.status(400).json({ error: 'Du kannst dir nicht selbst schreiben' });
  }

  const receiver = db.prepare('SELECT id FROM users WHERE id=?').get(receiver_id);
  if (!receiver) return res.status(404).json({ error: 'Empfänger nicht gefunden' });

  const result = db.prepare(
    'INSERT INTO messages (sender_id, receiver_id, content, job_id) VALUES (?,?,?,?)'
  ).run(req.user.id, receiver_id, content, job_id || null);

  const message = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM messages m JOIN users u ON m.sender_id=u.id
    WHERE m.id=?
  `).get(result.lastInsertRowid);

  res.status(201).json(message);
});

// GET /api/messages/unread/count
router.get('/unread/count', authenticate, (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM messages WHERE receiver_id=? AND read=0')
    .get(req.user.id);
  res.json({ count });
});

module.exports = router;
