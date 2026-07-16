// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email, branch_id: user.branch_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register  (public self-service member registration)
router.post('/register', (req, res) => {
  const { name, email, phone, password, plan_id, branch_id } = req.body;
  if (!name || !email || !password || !plan_id || !branch_id) {
    return res.status(400).json({ error: 'name, email, password, plan_id and branch_id are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(plan_id);
  if (!plan) return res.status(400).json({ error: 'Invalid plan_id' });

  const password_hash = bcrypt.hashSync(password, 8);

  const insertUser = db.prepare(`INSERT INTO users (role, name, email, phone, password_hash, branch_id)
    VALUES ('member', ?, ?, ?, ?, ?)`);
  const info = insertUser.run(name, email, phone || null, password_hash, branch_id);
  const userId = info.lastInsertRowid;

  const qr = `QR-${userId}-${Date.now()}`;
  db.prepare(`INSERT INTO member_profiles (user_id, plan_id, membership_start, membership_end, status, auto_renew, qr_code)
    VALUES (?, ?, date('now'), date('now', '+' || ? || ' day'), 'active', 1, ?)`)
    .run(userId, plan_id, plan.duration_days, qr);

  // Record the initial membership payment (mock payment gateway capture)
  db.prepare(`INSERT INTO payments (member_id, amount, type, gateway, gateway_ref, status)
    VALUES (?, ?, 'membership', 'stripe', ?, 'success')`)
    .run(userId, plan.price, `ch_${Date.now()}`);

  db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`)
    .run(userId, 'Welcome to FlexZone!', `Your ${plan.name} membership is now active.`, 'info');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, branch_id: user.branch_id } });
});

module.exports = router;
