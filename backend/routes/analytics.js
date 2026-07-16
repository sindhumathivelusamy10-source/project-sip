// routes/analytics.js
const express = require('express');
const db = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', authRequired, requireRole('admin'), (req, res) => {
  const totalMembers = db.prepare(`SELECT COUNT(*) n FROM users WHERE role='member'`).get().n;
  const activeMembers = db.prepare(`SELECT COUNT(*) n FROM member_profiles WHERE status='active'`).get().n;
  const totalTrainers = db.prepare(`SELECT COUNT(*) n FROM users WHERE role='trainer'`).get().n;
  const totalRevenue = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='success' AND type != 'refund'`).get().s;
  const totalRefunds = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM payments WHERE type='refund'`).get().s;
  const checkinsToday = db.prepare(`SELECT COUNT(*) n FROM attendance WHERE date(checkin_time)=date('now')`).get().n;

  // Membership growth over the last 6 months (by join month)
  const growth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS new_members
    FROM users WHERE role='member'
    GROUP BY month ORDER BY month DESC LIMIT 6`).all().reverse();

  // Class popularity by total bookings (confirmed + attended)
  const classPopularity = db.prepare(`
    SELECT c.name, COUNT(b.id) AS bookings
    FROM classes c LEFT JOIN bookings b ON b.class_id = c.id AND b.status IN ('confirmed','attended')
    GROUP BY c.id ORDER BY bookings DESC LIMIT 8`).all();

  // Revenue by month
  const revenueByMonth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month, COALESCE(SUM(amount),0) AS revenue
    FROM payments WHERE status='success' AND type != 'refund'
    GROUP BY month ORDER BY month DESC LIMIT 6`).all().reverse();

  // Plan distribution
  const planDistribution = db.prepare(`
    SELECT p.name, COUNT(mp.user_id) AS members
    FROM plans p LEFT JOIN member_profiles mp ON mp.plan_id = p.id AND mp.status='active'
    GROUP BY p.id`).all();

  res.json({
    totalMembers, activeMembers, totalTrainers, totalRevenue, totalRefunds, checkinsToday,
    growth, classPopularity, revenueByMonth, planDistribution
  });
});

module.exports = router;
