// routes/payments.js
// Simulates a Stripe/Razorpay payment gateway. In production, swap the
// `mockCharge()` function for real SDK calls (stripe.charges.create, etc.)
// and verify webhooks instead of trusting the client-provided result.
const express = require('express');
const db = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function mockCharge(amount, gateway) {
  // Simulates a network call to Stripe/Razorpay. Always succeeds in this demo.
  return { success: true, ref: `${gateway === 'razorpay' ? 'pay' : 'ch'}_${Date.now()}_${Math.floor(Math.random() * 1e6)}` };
}

// GET /api/payments/me - payment history for logged-in member
router.get('/me', authRequired, requireRole('member'), (req, res) => {
  const rows = db.prepare('SELECT * FROM payments WHERE member_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});

// GET /api/payments - admin: all payments (for revenue reports)
router.get('/', authRequired, requireRole('admin'), (req, res) => {
  const rows = db.prepare(`SELECT p.*, u.name AS member_name FROM payments p
    JOIN users u ON u.id = p.member_id ORDER BY p.created_at DESC`).all();
  res.json(rows);
});

// POST /api/payments/renew  { gateway } - manual or auto renewal charge
router.post('/renew', authRequired, requireRole('member'), (req, res) => {
  const { gateway = 'stripe' } = req.body;
  const profile = db.prepare('SELECT * FROM member_profiles WHERE user_id=?').get(req.user.id);
  const plan = db.prepare('SELECT * FROM plans WHERE id=?').get(profile.plan_id);
  if (!plan) return res.status(400).json({ error: 'No active plan on file' });

  const charge = mockCharge(plan.price, gateway);
  if (!charge.success) return res.status(402).json({ error: 'Payment failed' });

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO payments (member_id, amount, type, gateway, gateway_ref, status) VALUES (?,?,?,?,?,?)`)
      .run(req.user.id, plan.price, 'renewal', gateway, charge.ref, 'success');

    // extend membership_end from whichever is later: today or current end date
    db.prepare(`UPDATE member_profiles SET
        membership_end = date(MAX(membership_end, date('now')), '+' || ? || ' day'),
        status = 'active'
      WHERE user_id = ?`).run(plan.duration_days, req.user.id);

    db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`)
      .run(req.user.id, 'Renewal Successful', `Your ${plan.name} membership was renewed for ₹${plan.price}.`, 'renewal');
  });
  tx();

  res.json({ message: 'Membership renewed', ref: charge.ref });
});

// POST /api/payments/cancel - cancel membership with prorated refund
router.post('/cancel', authRequired, requireRole('member'), (req, res) => {
  const profile = db.prepare('SELECT * FROM member_profiles WHERE user_id=?').get(req.user.id);
  const plan = db.prepare('SELECT * FROM plans WHERE id=?').get(profile.plan_id);
  if (!profile || profile.status !== 'active') return res.status(400).json({ error: 'No active membership to cancel' });

  const today = new Date();
  const endDate = new Date(profile.membership_end);
  const startDate = new Date(profile.membership_start);
  const totalDays = Math.max(1, Math.round((endDate - startDate) / 86400000));
  const remainingDays = Math.max(0, Math.round((endDate - today) / 86400000));
  const dailyRate = plan.price / totalDays;
  const refundAmount = Math.round(dailyRate * remainingDays * 100) / 100;

  const tx = db.transaction(() => {
    db.prepare(`UPDATE member_profiles SET status='cancelled', auto_renew=0 WHERE user_id=?`).run(req.user.id);
    if (refundAmount > 0) {
      db.prepare(`INSERT INTO payments (member_id, amount, type, gateway, gateway_ref, status) VALUES (?,?,?,?,?,?)`)
        .run(req.user.id, refundAmount, 'refund', 'stripe', `rf_${Date.now()}`, 'refunded');
    }
    db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`)
      .run(req.user.id, 'Membership Cancelled', `Cancelled with a prorated refund of ₹${refundAmount} for ${remainingDays} unused day(s).`, 'info');
  });
  tx();

  res.json({ message: 'Membership cancelled', remainingDays, totalDays, dailyRate: Math.round(dailyRate * 100) / 100, refundAmount });
});

// POST /api/payments/class  { class_id } - pay-per-class charge (for plans with 0 included credits)
router.post('/class', authRequired, requireRole('member'), (req, res) => {
  const { class_id, gateway = 'stripe' } = req.body;
  const CLASS_DROP_IN_PRICE = 299;
  const charge = mockCharge(CLASS_DROP_IN_PRICE, gateway);
  if (!charge.success) return res.status(402).json({ error: 'Payment failed' });

  db.prepare(`INSERT INTO payments (member_id, amount, type, gateway, gateway_ref, status) VALUES (?,?,?,?,?,?)`)
    .run(req.user.id, CLASS_DROP_IN_PRICE, 'class', gateway, charge.ref, 'success');

  res.json({ message: 'Class payment successful', amount: CLASS_DROP_IN_PRICE, ref: charge.ref });
});

module.exports = router;
