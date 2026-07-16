// routes/bookings.js
const express = require('express');
const db = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/bookings/me - all bookings for the logged-in member
router.get('/me', authRequired, requireRole('member'), (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, c.name AS class_name, c.start_time, c.end_time, c.day_of_week, u.name AS trainer_name
    FROM bookings b
    JOIN classes c ON c.id = b.class_id
    JOIN users u ON u.id = c.trainer_id
    WHERE b.member_id = ?
    ORDER BY b.class_date DESC`).all(req.user.id);
  res.json(rows);
});

// POST /api/bookings  { class_id, class_date }
// Books a seat if capacity allows, otherwise auto-waitlists the member.
router.post('/', authRequired, requireRole('member'), (req, res) => {
  const { class_id, class_date } = req.body;
  if (!class_id || !class_date) return res.status(400).json({ error: 'class_id and class_date are required' });

  const gymClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(class_id);
  if (!gymClass) return res.status(404).json({ error: 'Class not found' });

  const already = db.prepare(`SELECT * FROM bookings WHERE member_id=? AND class_id=? AND class_date=? AND status IN ('confirmed','waitlisted')`)
    .get(req.user.id, class_id, class_date);
  if (already) return res.status(409).json({ error: `Already ${already.status} for this class` });

  const confirmedCount = db.prepare(`SELECT COUNT(*) AS n FROM bookings WHERE class_id=? AND class_date=? AND status='confirmed'`)
    .get(class_id, class_date).n;

  const status = confirmedCount < gymClass.capacity ? 'confirmed' : 'waitlisted';

  const info = db.prepare(`INSERT INTO bookings (member_id, class_id, class_date, status) VALUES (?,?,?,?)`)
    .run(req.user.id, class_id, class_date, status);

  const msg = status === 'confirmed'
    ? `You're booked for "${gymClass.name}" on ${class_date}.`
    : `"${gymClass.name}" on ${class_date} is full. You've been added to the waitlist and will be notified if a spot opens.`;
  db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`)
    .run(req.user.id, status === 'confirmed' ? 'Class Booked' : 'Added to Waitlist', msg, status === 'confirmed' ? 'info' : 'waitlist');

  res.status(201).json({ id: info.lastInsertRowid, status, message: msg });
});

// DELETE /api/bookings/:id - cancel a booking; auto-promotes the next waitlisted member
router.delete('/:id', authRequired, requireRole('member'), (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id=? AND member_id=?').get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(409).json({ error: 'Already cancelled' });

  const wasConfirmed = booking.status === 'confirmed';

  const tx = db.transaction(() => {
    db.prepare(`UPDATE bookings SET status='cancelled' WHERE id=?`).run(booking.id);

    if (wasConfirmed) {
      // Promote the earliest waitlisted member for this class/date, if any
      const next = db.prepare(`SELECT * FROM bookings WHERE class_id=? AND class_date=? AND status='waitlisted'
        ORDER BY booked_at ASC LIMIT 1`).get(booking.class_id, booking.class_date);
      if (next) {
        db.prepare(`UPDATE bookings SET status='confirmed' WHERE id=?`).run(next.id);
        const gymClass = db.prepare('SELECT name FROM classes WHERE id=?').get(booking.class_id);
        db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,'waitlist')`)
          .run(next.member_id, 'Spot Opened Up!', `A seat opened in "${gymClass.name}" on ${booking.class_date} — you're now confirmed.`);
      }
    }
  });
  tx();

  res.json({ message: 'Booking cancelled' });
});

// GET /api/bookings/class/:classId?date= - admin/trainer roster for a class on a date
router.get('/class/:classId', authRequired, requireRole('admin', 'trainer'), (req, res) => {
  const { date } = req.query;
  let sql = `SELECT b.*, u.name AS member_name, u.email FROM bookings b
    JOIN users u ON u.id = b.member_id WHERE b.class_id = ?`;
  const params = [req.params.classId];
  if (date) { sql += ' AND b.class_date = ?'; params.push(date); }
  sql += " AND b.status IN ('confirmed','waitlisted') ORDER BY b.status, b.booked_at";
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;
