// routes/members.js
const express = require('express');
const QRCode = require('qrcode');
const db = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/members/me - full profile for the logged-in member
router.get('/me', authRequired, requireRole('member'), (req, res) => {
  const profile = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.branch_id,
           mp.plan_id, mp.membership_start, mp.membership_end, mp.status,
           mp.auto_renew, mp.locker_id, mp.qr_code, mp.height_cm, mp.starting_weight_kg,
           p.name AS plan_name, p.price AS plan_price, p.duration_days, p.class_credits
    FROM users u
    JOIN member_profiles mp ON mp.user_id = u.id
    LEFT JOIN plans p ON p.id = mp.plan_id
    WHERE u.id = ?`).get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Member profile not found' });
  res.json(profile);
});

// GET /api/members  - admin: list all members
router.get('/', authRequired, requireRole('admin', 'trainer'), (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.branch_id,
           mp.status, mp.membership_end, p.name AS plan_name
    FROM users u
    JOIN member_profiles mp ON mp.user_id = u.id
    LEFT JOIN plans p ON p.id = mp.plan_id
    ORDER BY u.created_at DESC`).all();
  res.json(rows);
});

// GET /api/members/:id - admin/trainer view of a single member
router.get('/:id', authRequired, requireRole('admin', 'trainer'), (req, res) => {
  const profile = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.branch_id,
           mp.plan_id, mp.membership_start, mp.membership_end, mp.status,
           mp.locker_id, p.name AS plan_name
    FROM users u
    JOIN member_profiles mp ON mp.user_id = u.id
    LEFT JOIN plans p ON p.id = mp.plan_id
    WHERE u.id = ?`).get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  res.json(profile);
});

// GET /api/members/me/qrcode - PNG data URL for check-in
router.get('/me/qrcode', authRequired, requireRole('member'), async (req, res) => {
  const row = db.prepare('SELECT qr_code FROM member_profiles WHERE user_id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  try {
    const dataUrl = await QRCode.toDataURL(row.qr_code, { width: 260, margin: 1 });
    res.json({ qr_code: row.qr_code, image: dataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ---------------------------------------------------------------------
// Progress tracking
// ---------------------------------------------------------------------

// GET /api/members/me/progress
router.get('/me/progress', authRequired, requireRole('member'), (req, res) => {
  const logs = db.prepare('SELECT * FROM progress_logs WHERE member_id = ? ORDER BY log_date ASC').all(req.user.id);
  res.json(logs);
});

// POST /api/members/me/progress  { log_date, weight_kg, body_fat_pct, notes }
router.post('/me/progress', authRequired, requireRole('member'), (req, res) => {
  const { log_date, weight_kg, body_fat_pct, notes } = req.body;
  if (!log_date) return res.status(400).json({ error: 'log_date is required' });
  const info = db.prepare(`INSERT INTO progress_logs (member_id, log_date, weight_kg, body_fat_pct, notes)
    VALUES (?,?,?,?,?)`).run(req.user.id, log_date, weight_kg || null, body_fat_pct || null, notes || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---------------------------------------------------------------------
// Workout & nutrition plans (read for member, write for trainer - see trainers.js)
// ---------------------------------------------------------------------

router.get('/me/workout-plans', authRequired, requireRole('member'), (req, res) => {
  const plans = db.prepare(`SELECT wp.*, u.name AS trainer_name FROM workout_plans wp
    JOIN users u ON u.id = wp.trainer_id WHERE wp.member_id = ? ORDER BY wp.created_at DESC`).all(req.user.id);
  res.json(plans.map(p => ({ ...p, details: JSON.parse(p.details) })));
});

router.get('/me/nutrition-plans', authRequired, requireRole('member'), (req, res) => {
  const plans = db.prepare(`SELECT np.*, u.name AS trainer_name FROM nutrition_plans np
    JOIN users u ON u.id = np.trainer_id WHERE np.member_id = ? ORDER BY np.created_at DESC`).all(req.user.id);
  res.json(plans.map(p => ({ ...p, details: JSON.parse(p.details) })));
});

// ---------------------------------------------------------------------
// Lockers
// ---------------------------------------------------------------------

// GET /api/members/lockers/available?branch_id=
router.get('/lockers/available', authRequired, (req, res) => {
  const branchId = req.query.branch_id || req.user.branch_id;
  const lockers = db.prepare('SELECT * FROM lockers WHERE branch_id = ? ORDER BY locker_number').all(branchId);
  res.json(lockers);
});

// POST /api/members/me/locker  { locker_id }
router.post('/me/locker', authRequired, requireRole('member'), (req, res) => {
  const { locker_id } = req.body;
  const locker = db.prepare('SELECT * FROM lockers WHERE id = ?').get(locker_id);
  if (!locker) return res.status(404).json({ error: 'Locker not found' });
  if (locker.status !== 'available') return res.status(409).json({ error: 'Locker is not available' });

  const tx = db.transaction(() => {
    // release any previous locker held by this member
    db.prepare(`UPDATE lockers SET status='available', member_id=NULL
      WHERE member_id = ?`).run(req.user.id);
    db.prepare(`UPDATE lockers SET status='assigned', member_id=? WHERE id=?`).run(req.user.id, locker_id);
    db.prepare('UPDATE member_profiles SET locker_id=? WHERE user_id=?').run(locker_id, req.user.id);
  });
  tx();
  res.json({ message: 'Locker assigned', locker_id });
});

// DELETE /api/members/me/locker - release current locker
router.delete('/me/locker', authRequired, requireRole('member'), (req, res) => {
  const tx = db.transaction(() => {
    db.prepare(`UPDATE lockers SET status='available', member_id=NULL WHERE member_id=?`).run(req.user.id);
    db.prepare('UPDATE member_profiles SET locker_id=NULL WHERE user_id=?').run(req.user.id);
  });
  tx();
  res.json({ message: 'Locker released' });
});

module.exports = router;
