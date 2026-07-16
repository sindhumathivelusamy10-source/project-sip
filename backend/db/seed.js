// db/seed.js
// Populates the database with demo data: branches, plans, an admin,
// trainers, members, classes and lockers. Run with `npm run seed`.

const bcrypt = require('bcryptjs');
const db = require('./database');

const hash = (pw) => bcrypt.hashSync(pw, 8);

function seed() {
  console.log('Seeding database...');

  // Order matters under FK constraints: member_profiles.locker_id references
  // lockers(id), so member_profiles must be cleared before lockers, and
  // lockers.member_id references users so lockers must go before users, etc.
  db.exec(`
    DELETE FROM notifications; DELETE FROM progress_logs;
    DELETE FROM nutrition_plans; DELETE FROM workout_plans; DELETE FROM attendance;
    DELETE FROM payments; DELETE FROM bookings; DELETE FROM classes;
    DELETE FROM trainer_profiles; DELETE FROM member_profiles; DELETE FROM lockers;
    DELETE FROM users; DELETE FROM plans; DELETE FROM branches;
  `);

  // ---- Branches ----
  const insBranch = db.prepare('INSERT INTO branches (name, address, phone) VALUES (?,?,?)');
  const b1 = insBranch.run('FlexZone Downtown', '12 MG Road, Chennai', '044-2233-1100').lastInsertRowid;
  const b2 = insBranch.run('FlexZone Uptown', '88 OMR, Chennai', '044-2233-1200').lastInsertRowid;

  // ---- Plans ----
  const insPlan = db.prepare('INSERT INTO plans (name, description, price, duration_days, class_credits) VALUES (?,?,?,?,?)');
  const planBasic = insPlan.run('Basic Monthly', 'Gym floor access only', 1499, 30, 0).lastInsertRowid;
  const planPlus = insPlan.run('Plus Monthly', 'Gym access + 8 classes/month', 2499, 30, 8).lastInsertRowid;
  const planElite = insPlan.run('Elite Quarterly', 'Unlimited classes, trainer support', 6999, 90, -1).lastInsertRowid;

  // ---- Admin ----
  const insUser = db.prepare(`INSERT INTO users (role,name,email,phone,password_hash,branch_id) VALUES (?,?,?,?,?,?)`);
  const adminId = insUser.run('admin', 'Gym Admin', 'admin@flexzone.com', '9000000001', hash('admin123'), b1).lastInsertRowid;

  // ---- Trainers ----
  const insTrainerProfile = db.prepare('INSERT INTO trainer_profiles (user_id, specialty, bio, years_experience) VALUES (?,?,?,?)');
  const trainer1 = insUser.run('trainer', 'Arjun Mehta', 'arjun@flexzone.com', '9000000002', hash('trainer123'), b1).lastInsertRowid;
  insTrainerProfile.run(trainer1, 'Strength & Conditioning', 'Certified NASM trainer, 8 years coaching powerlifters.', 8);
  const trainer2 = insUser.run('trainer', 'Priya Nair', 'priya@flexzone.com', '9000000003', hash('trainer123'), b1).lastInsertRowid;
  insTrainerProfile.run(trainer2, 'Yoga & Mobility', 'RYT-500 yoga instructor focused on recovery and flexibility.', 6);
  const trainer3 = insUser.run('trainer', 'Karthik Raja', 'karthik@flexzone.com', '9000000004', hash('trainer123'), b2).lastInsertRowid;
  insTrainerProfile.run(trainer3, 'HIIT & Cardio', 'Former athlete specializing in high-intensity fat-loss programs.', 5);

  // ---- Members ----
  const insMemberProfile = db.prepare(`INSERT INTO member_profiles
    (user_id, plan_id, membership_start, membership_end, status, auto_renew, qr_code, height_cm, starting_weight_kg)
    VALUES (?,?,date('now'),date('now','+30 day'),'active',1,?,?,?)`);

  const member1 = insUser.run('member', 'Ravi Kumar', 'ravi@example.com', '9000000010', hash('member123'), b1).lastInsertRowid;
  insMemberProfile.run(member1, planPlus, `QR-${member1}-${Date.now()}`, 175, 82);

  const member2 = insUser.run('member', 'Sneha Iyer', 'sneha@example.com', '9000000011', hash('member123'), b1).lastInsertRowid;
  insMemberProfile.run(member2, planElite, `QR-${member2}-${Date.now()}`, 162, 60);

  const member3 = insUser.run('member', 'Vikram Singh', 'vikram@example.com', '9000000012', hash('member123'), b2).lastInsertRowid;
  insMemberProfile.run(member3, planBasic, `QR-${member3}-${Date.now()}`, 180, 90);

  // ---- Classes ----
  const insClass = db.prepare(`INSERT INTO classes (name, description, trainer_id, branch_id, day_of_week, start_time, end_time, capacity, category)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  insClass.run('Power Lifting Basics', 'Build raw strength with compound lifts.', trainer1, b1, 'Monday', '07:00', '08:00', 12, 'Strength');
  insClass.run('Sunrise Yoga', 'Gentle flow to start your day.', trainer2, b1, 'Monday', '06:00', '07:00', 20, 'Yoga');
  insClass.run('HIIT Blast', '30 minutes of max-effort intervals.', trainer3, b2, 'Tuesday', '18:00', '18:45', 15, 'Cardio');
  insClass.run('Strength Circuit', 'Full body circuit training.', trainer1, b1, 'Wednesday', '17:00', '18:00', 12, 'Strength');
  insClass.run('Vinyasa Flow', 'Dynamic yoga sequence.', trainer2, b1, 'Thursday', '06:00', '07:00', 20, 'Yoga');
  insClass.run('HIIT Blast', '30 minutes of max-effort intervals.', trainer3, b2, 'Friday', '18:00', '18:45', 15, 'Cardio');
  insClass.run('Weekend Warrior Bootcamp', 'Outdoor style bootcamp workout.', trainer1, b1, 'Saturday', '09:00', '10:00', 10, 'Bootcamp');

  // ---- Lockers ----
  const insLocker = db.prepare('INSERT INTO lockers (branch_id, locker_number, status, member_id) VALUES (?,?,?,?)');
  for (let i = 1; i <= 10; i++) {
    if (i === 1) insLocker.run(b1, `A-${i.toString().padStart(2, '0')}`, 'assigned', member1);
    else insLocker.run(b1, `A-${i.toString().padStart(2, '0')}`, 'available', null);
  }
  for (let i = 1; i <= 8; i++) {
    insLocker.run(b2, `B-${i.toString().padStart(2, '0')}`, 'available', null);
  }
  db.prepare('UPDATE member_profiles SET locker_id = (SELECT id FROM lockers WHERE member_id = ?) WHERE user_id = ?').run(member1, member1);

  // ---- Sample payments ----
  const insPayment = db.prepare(`INSERT INTO payments (member_id, amount, type, gateway, gateway_ref, status, created_at)
    VALUES (?,?,?,?,?,?,datetime('now','-15 day'))`);
  insPayment.run(member1, 2499, 'membership', 'stripe', 'ch_demo_001', 'success');
  insPayment.run(member2, 6999, 'membership', 'razorpay', 'pay_demo_002', 'success');
  insPayment.run(member3, 1499, 'membership', 'stripe', 'ch_demo_003', 'success');

  // ---- Sample progress logs ----
  const insProgress = db.prepare(`INSERT INTO progress_logs (member_id, log_date, weight_kg, body_fat_pct, notes)
    VALUES (?, date('now', ?), ?, ?, ?)`);
  insProgress.run(member1, '-21 day', 84, 22, 'Starting point');
  insProgress.run(member1, '-14 day', 83, 21, 'Feeling stronger');
  insProgress.run(member1, '-7 day', 82.2, 20.5, 'Good week');
  insProgress.run(member1, '0 day', 81.5, 20, 'Consistent progress');

  // ---- Sample workout & nutrition plans ----
  const insWorkout = db.prepare('INSERT INTO workout_plans (member_id, trainer_id, title, details) VALUES (?,?,?,?)');
  insWorkout.run(member1, trainer1, '4-Week Strength Foundation', JSON.stringify([
    { day: 'Monday', exercises: [{ name: 'Squat', sets: 4, reps: '8' }, { name: 'Bench Press', sets: 4, reps: '8' }] },
    { day: 'Wednesday', exercises: [{ name: 'Deadlift', sets: 3, reps: '5' }, { name: 'Pull-ups', sets: 3, reps: '10' }] },
    { day: 'Friday', exercises: [{ name: 'Overhead Press', sets: 4, reps: '8' }, { name: 'Rows', sets: 4, reps: '10' }] }
  ]));

  const insNutrition = db.prepare('INSERT INTO nutrition_plans (member_id, trainer_id, title, details) VALUES (?,?,?,?)');
  insNutrition.run(member1, trainer1, 'Lean Muscle Diet', JSON.stringify([
    { meal: 'Breakfast', items: 'Oats, egg whites, banana', calories: 450 },
    { meal: 'Lunch', items: 'Grilled chicken, brown rice, salad', calories: 650 },
    { meal: 'Dinner', items: 'Fish, quinoa, vegetables', calories: 550 }
  ]));

  console.log('Seed complete.');
  console.log('Admin login: admin@flexzone.com / admin123');
  console.log('Trainer login: arjun@flexzone.com / trainer123');
  console.log('Member login: ravi@example.com / member123');
}

seed();
