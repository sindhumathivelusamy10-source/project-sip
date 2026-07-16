// routes/attendance.js
const express = require('express');
const db = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/attendance/checkin  { qr_code, class_id? }
// Called by the front-desk / admin scanner app after reading a member's QR code.
router.post('/checkin', authRequired, requireRole('admin', 'trainer'), (req, res) => {
  const { qr_code, class_id } = req.body;
  if (!qr_code) return res.status(400).json({ error: 'qr_code is required' });

  const profile = db.prepare('SELECT * FROM member_profiles WHERE qr_code = ?').get(qr_code);
  if (!profile) return res.status(404).json({ error: 'QR code not recognized' });
  if (profile.status !== 'active') return res.status(403).json({ error: `Membership is ${profile.status}, entry denied` });

  const member = db.prepare('SELECT * FROM users WHERE id = ?').get(profile.user_id);

  const info = db.prepare(`INSERT INTO attendance (member_id, branch_id, class_id) VALUES (?,?,?)`)
    .run(member.id, member.branch_id, class_id || null);

  if (class_id) {
    db.prepare(`UPDATE bookings SET status='attended'
      WHERE member_id=? AND class_id=? AND class_date=date('now') AND status='confirmed'`).run(member.id, class_id);
  }

  res.status(201).json({ message: `Checked in: ${member.name}`, attendance_id: info.lastInsertRowid, member: { id: member.id, name: member.name } });
});

// GET /api/attendance/me - member's own check-in history
router.get('/me', authRequired, requireRole('member'), (req, res) => {
  const rows = db.prepare('SELECT * FROM attendance WHERE member_id=? ORDER BY checkin_time DESC LIMIT 100').all(req.user.id);
  res.json(rows);
});

// GET /api/attendance?branch_id=&date= - admin: attendance log
router.get('/', authRequired, requireRole('admin', 'trainer'), (req, res) => {
  const { branch_id, date } = req.query;
  let sql = `SELECT a.*, u.name AS member_name FROM attendance a JOIN users u ON u.id=a.member_id WHERE 1=1`;
  const params = [];
  if (branch_id) { sql += ' AND a.branch_id=?'; params.push(branch_id); }
  if (date) { sql += " AND date(a.checkin_time)=?"; params.push(date); }
  sql += ' ORDER BY a.checkin_time DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;
