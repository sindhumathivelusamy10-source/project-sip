// db/database.js
// Creates/opens the SQLite database file and defines the full schema.
// Using better-sqlite3 because it is synchronous, fast, and needs no extra
// server process -- perfect for a self-contained gym management backend.

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'gym.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
-- ---------------------------------------------------------------------
-- BRANCHES (multi-branch support)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- MEMBERSHIP PLANS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  duration_days INTEGER NOT NULL,
  class_credits INTEGER DEFAULT -1, -- -1 = unlimited
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- USERS (members, trainers, admins share a login table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('member','trainer','admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  branch_id INTEGER REFERENCES branches(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Member-specific profile data
CREATE TABLE IF NOT EXISTS member_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES plans(id),
  membership_start TEXT,
  membership_end TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','cancelled','frozen')),
  auto_renew INTEGER DEFAULT 1,
  locker_id INTEGER REFERENCES lockers(id),
  qr_code TEXT UNIQUE,
  height_cm REAL,
  starting_weight_kg REAL
);

-- Trainer-specific profile data
CREATE TABLE IF NOT EXISTS trainer_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialty TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0
);

-- ---------------------------------------------------------------------
-- CLASSES / SCHEDULE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  trainer_id INTEGER REFERENCES users(id),
  branch_id INTEGER REFERENCES branches(id),
  day_of_week TEXT NOT NULL, -- Monday..Sunday
  start_time TEXT NOT NULL,  -- HH:MM
  end_time TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 15,
  category TEXT DEFAULT 'General'
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  class_date TEXT NOT NULL, -- specific calendar date booked (YYYY-MM-DD)
  status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','waitlisted','cancelled','attended','no_show')),
  booked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, class_id, class_date)
);

-- ---------------------------------------------------------------------
-- PAYMENTS / BILLING
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('membership','renewal','class','refund')),
  gateway TEXT DEFAULT 'stripe',
  gateway_ref TEXT,
  status TEXT DEFAULT 'success' CHECK(status IN ('success','failed','pending','refunded')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- ATTENDANCE (QR check-in)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id),
  checkin_time TEXT DEFAULT CURRENT_TIMESTAMP,
  class_id INTEGER REFERENCES classes(id)
);

-- ---------------------------------------------------------------------
-- WORKOUT PLANS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  trainer_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  details TEXT NOT NULL, -- JSON string: [{day, exercises:[{name,sets,reps}]}]
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- NUTRITION PLANS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  trainer_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  details TEXT NOT NULL, -- JSON string: [{meal, items, calories}]
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- PROGRESS TRACKING
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  weight_kg REAL,
  body_fat_pct REAL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- LOCKERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lockers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER REFERENCES branches(id),
  locker_number TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK(status IN ('available','assigned','maintenance')),
  member_id INTEGER REFERENCES users(id)
);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS (push / renewal / waitlist alerts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info | renewal | waitlist | class_change
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
