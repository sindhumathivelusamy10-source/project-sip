// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const trainerRoutes = require('./routes/trainers');
const classRoutes = require('./routes/classes');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const miscRoutes = require('./routes/misc');
const analyticsRoutes = require('./routes/analytics');
const { startScheduler } = require('./jobs/scheduler');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve the static frontend (member portal + admin panel) from the backend
// so the whole system can be run with a single `node server.js`.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', miscRoutes); // /api/branches, /api/plans, /api/notifications

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Gym Management API running on http://localhost:${PORT}`);
  startScheduler();
});
