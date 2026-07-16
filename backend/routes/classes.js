// routes/classes.js
const express = require('express');
const db = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/classes?branch_id=&category=&day=&trainer_id=
// Returns classes with live booked-count so the UI can show remaining seats.
router.get('/', authRequired, (req, res) => {
  const { branch_id, category, day, trainer_id } = req.query;
  let sql = `
    SELECT c.*, u.name AS trainer_name,
      (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status='confirmed') AS booked_count,
      (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status='waitlisted') AS waitlist_count
    FROM classes c
    JOIN users u ON u.id = c.trainer_id
    WHERE 1=1`;
  const params = [];
  if (branch_id) { sql += ' AND c.branch_id = ?'; params.push(branch_id); }
  if (category) { sql += ' AND c.category = ?'; params.push(category); }
  if (day) { sql += ' AND c.day_of_week = ?'; params.push(day); }
  if (trainer_id) { sql += ' AND c.trainer_id = ?'; params.push(trainer_id); }
  sql += ' ORDER BY CASE c.day_of_week ' +
    "WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 " +
    "WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 END, c.start_time";

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// GET /api/classes/:id
router.get('/:id', authRequired, (req, res) => {
  const row = db.prepare(`SELECT c.*, u.name AS trainer_name FROM classes c
    JOIN users u ON u.id = c.trainer_id WHERE c.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Class not found' });
  res.json(row);
});

// POST /api/classes - admin creates a class
router.post('/', authRequired, requireRole('admin'), (req, res) => {
  const { name, description, trainer_id, branch_id, day_of_week, start_time, end_time, capacity, category } = req.body;
  if (!name || !trainer_id || !branch_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required class fields' });
  }
  const info = db.prepare(`INSERT INTO classes (name,description,trainer_id,branch_id,day_of_week,start_time,end_time,capacity,category)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(name, description || null, trainer_id, branch_id, day_of_week, start_time, end_time, capacity || 15, category || 'General');
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/classes/:id - admin edits a class (also used to broadcast schedule changes)
router.put('/:id', authRequired, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM classes WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Class not found' });

  const fields = ['name', 'description', 'trainer_id', 'branch_id', 'day_of_week', 'start_time', 'end_time', 'capacity', 'category'];
  const updated = { ...existing, ...req.body };
  db.prepare(`UPDATE classes SET ${fields.map(f => `${f}=?`).join(',')} WHERE id=?`)
    .run(...fields.map(f => updated[f]), req.params.id);

  // Notify everyone with a confirmed/waitlisted booking about the change
  const bookedMembers = db.prepare(`SELECT DISTINCT member_id FROM bookings WHERE class_id=? AND status IN ('confirmed','waitlisted')`).all(req.params.id);
  const notify = db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,'class_change')`);
  bookedMembers.forEach(m => notify.run(m.member_id, 'Class Updated', `"${updated.name}" schedule has been updated.`));

  res.json({ message: 'Class updated' });
});

// DELETE /api/classes/:id - admin cancels a class entirely
router.delete('/:id', authRequired, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM classes WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Class not found' });

  const bookedMembers = db.prepare(`SELECT DISTINCT member_id FROM bookings WHERE class_id=? AND status IN ('confirmed','waitlisted')`).all(req.params.id);
  const notify = db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,'class_change')`);
  bookedMembers.forEach(m => notify.run(m.member_id, 'Class Cancelled', `"${existing.name}" has been cancelled.`));

  db.prepare('DELETE FROM classes WHERE id=?').run(req.params.id);
  res.json({ message: 'Class deleted' });
});

module.exports = router;
