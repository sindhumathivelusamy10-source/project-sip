// routes/misc.js
// Small, related resources bundled to keep the route count manageable:
// branches, membership plans, and in-app notifications.
const express = require('express');
const db = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---- Branches (multi-branch support) ----
router.get('/branches', (req, res) => {
  res.json(db.prepare('SELECT * FROM branches ORDER BY name').all());
});

router.post('/branches', authRequired, requireRole('admin'), (req, res) => {
  const { name, address, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db.prepare('INSERT INTO branches (name, address, phone) VALUES (?,?,?)').run(name, address || null, phone || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---- Membership plans ----
router.get('/plans', (req, res) => {
  res.json(db.prepare('SELECT * FROM plans ORDER BY price').all());
});

router.post('/plans', authRequired, requireRole('admin'), (req, res) => {
  const { name, description, price, duration_days, class_credits } = req.body;
  if (!name || !price || !duration_days) return res.status(400).json({ error: 'name, price, duration_days required' });
  const info = db.prepare(`INSERT INTO plans (name, description, price, duration_days, class_credits) VALUES (?,?,?,?,?)`)
    .run(name, description || null, price, duration_days, class_credits ?? -1);
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---- Notifications ----
router.get('/notifications/me', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(rows);
});

router.post('/notifications/:id/read', authRequired, (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ message: 'Marked as read' });
});

module.exports = router;
