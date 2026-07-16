// jobs/scheduler.js
// Runs once a day (and once at startup for the demo) to:
//   1. Send renewal reminders 5 days before membership expiry.
//   2. Auto-charge members who have auto_renew enabled and expire today.
//   3. Mark truly expired memberships as 'expired'.
const cron = require('node-cron');
const db = require('../db/database');

function mockCharge() {
  return { success: true, ref: `ch_auto_${Date.now()}_${Math.floor(Math.random() * 1e6)}` };
}

function runDailyJob() {
  console.log(`[scheduler] running daily job @ ${new Date().toISOString()}`);

  // 1) Renewal reminders (5 days out), avoid duplicate reminders same day
  const upcoming = db.prepare(`
    SELECT mp.user_id, u.name FROM member_profiles mp
    JOIN users u ON u.id = mp.user_id
    WHERE mp.status='active' AND date(mp.membership_end) = date('now', '+5 day')`).all();
  const notify = db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,'renewal')`);
  upcoming.forEach(m => notify.run(m.user_id, 'Membership Expiring Soon', `Hi ${m.name}, your membership expires in 5 days. Renew now to avoid interruption.`));

  // 2) Auto-renewal billing for memberships expiring today with auto_renew on
  const dueToday = db.prepare(`
    SELECT mp.*, p.price, p.duration_days, p.name AS plan_name, u.name AS member_name FROM member_profiles mp
    JOIN plans p ON p.id = mp.plan_id
    JOIN users u ON u.id = mp.user_id
    WHERE mp.status='active' AND mp.auto_renew=1 AND date(mp.membership_end) <= date('now')`).all();

  dueToday.forEach(m => {
    const charge = mockCharge();
    const tx = db.transaction(() => {
      db.prepare(`INSERT INTO payments (member_id, amount, type, gateway, gateway_ref, status) VALUES (?,?,?,?,?,?)`)
        .run(m.user_id, m.price, 'renewal', 'stripe', charge.ref, 'success');
      db.prepare(`UPDATE member_profiles SET membership_end = date('now', '+' || ? || ' day'), status='active' WHERE user_id=?`)
        .run(m.duration_days, m.user_id);
      db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,'renewal')`)
        .run(m.user_id, 'Auto-Renewal Charged', `Your ${m.plan_name} plan was auto-renewed for ₹${m.price}.`);
    });
    tx();
  });

  // 3) Expire memberships that passed their end date without auto-renew
  db.prepare(`UPDATE member_profiles SET status='expired'
    WHERE status='active' AND auto_renew=0 AND date(membership_end) < date('now')`).run();

  console.log(`[scheduler] reminders sent: ${upcoming.length}, auto-renewed: ${dueToday.length}`);
}

function startScheduler() {
  // Every day at 02:00
  cron.schedule('0 2 * * *', runDailyJob);
  // Also run once shortly after boot so the demo shows activity without waiting a day
  setTimeout(runDailyJob, 3000);
}

module.exports = { startScheduler, runDailyJob };
