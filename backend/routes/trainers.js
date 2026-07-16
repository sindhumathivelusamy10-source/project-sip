// routes/trainers.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/trainers - public-ish list (used by booking/class filters)
router.get('/', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.branch_id, tp.specialty, tp.bio, tp.years_experience
    FROM users u JOIN trainer_profiles tp ON tp.user_id = u.id
    ORDER BY u.name`).all();
  res.json(rows);
});

// GET /api/trainers/me/classes - classes assigned to the logged-in trainer
router.get('/me/classes', authRequired, requireRole('trainer'), (req, res) => {
  const rows = db.prepare('SELECT * FROM classes WHERE trainer_id = ? ORDER BY day_of_week, start_time').all(req.user.id);
  res.json(rows);
});

// GET /api/trainers/me/members - members who booked this trainer's classes at least once
router.get('/me/members', authRequired, requireRole('trainer'), (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT u.id, u.name, u.email, mp.status
    FROM bookings b
    JOIN classes c ON c.id = b.class_id
    JOIN users u ON u.id = b.member_id
    JOIN member_profiles mp ON mp.user_id = u.id
    WHERE c.trainer_id = ?
    ORDER BY u.name`).all(req.user.id);
  res.json(rows);
});

// POST /api/trainers  - admin creates a trainer account
router.post('/', authRequired, requireRole('admin'), (req, res) => {
  const { name, email, phone, password, branch_id, specialty, bio, years_experience } = req.body;
  if (!name || !email || !password || !branch_id) {
    return res.status(400).json({ error: 'name, email, password, branch_id are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const password_hash = bcrypt.hashSync(password, 8);
  const info = db.prepare(`INSERT INTO users (role,name,email,phone,password_hash,branch_id)
    VALUES ('trainer',?,?,?,?,?)`).run(name, email, phone || null, password_hash, branch_id);
  db.prepare(`INSERT INTO trainer_profiles (user_id, specialty, bio, years_experience) VALUES (?,?,?,?)`)
    .run(info.lastInsertRowid, specialty || null, bio || null, years_experience || 0);

  res.status(201).json({ id: info.lastInsertRowid });
});

// POST /api/trainers/workout-plans - trainer assigns a workout plan to a member
router.post('/workout-plans', authRequired, requireRole('trainer'), (req, res) => {
  const { member_id, title, details } = req.body;
  if (!member_id || !title || !details) return res.status(400).json({ error: 'member_id, title, details required' });

  const info = db.prepare(`INSERT INTO workout_plans (member_id, trainer_id, title, details) VALUES (?,?,?,?)`)
    .run(member_id, req.user.id, title, JSON.stringify(details));

  db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`)
    .run(member_id, 'New Workout Plan', `${req.user.name} assigned you a new plan: "${title}"`, 'info');

  res.status(201).json({ id: info.lastInsertRowid });
});

// POST /api/trainers/nutrition-plans - trainer attaches a diet plan to a member
router.post('/nutrition-plans', authRequired, requireRole('trainer'), (req, res) => {
  const { member_id, title, details } = req.body;
  if (!member_id || !title || !details) return res.status(400).json({ error: 'member_id, title, details required' });

  const info = db.prepare(`INSERT INTO nutrition_plans (member_id, trainer_id, title, details) VALUES (?,?,?,?)`)
    .run(member_id, req.user.id, title, JSON.stringify(details));

  db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`)
    .run(member_id, 'New Nutrition Plan', `${req.user.name} attached a new diet plan: "${title}"`, 'info');

  res.status(201).json({ id: info.lastInsertRowid });
});

module.exports = router;
