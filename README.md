# FlexZone — Gym Membership Management System

A full-stack gym management system: member registration & plans, class
scheduling & booking with waitlists, trainer assignments, workout/nutrition
plans, progress tracking, QR-code attendance, lockers, multi-branch support,
billing (renewals, auto-renewal, prorated refunds), and an admin analytics
dashboard.

## Stack

- **Backend:** Node.js, Express, SQLite (via `better-sqlite3`), JWT auth, `node-cron` for scheduled billing/reminders, `qrcode` for check-in codes.
- **Frontend:** Plain HTML/CSS/JavaScript (no build step) — a member portal (`index.html`) and a staff panel for admins & trainers (`admin.html`).
- **Database:** SQLite file, auto-created at `backend/db/gym.db`.

## Project structure

```
gym-management-system/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── db/
│   │   ├── database.js        # Schema + connection
│   │   ├── seed.js            # Demo data (branches, plans, users, classes...)
│   │   └── gym.db             # SQLite file (created on first run)
│   ├── middleware/auth.js      # JWT verification & role guard
│   ├── routes/                 # auth, members, trainers, classes, bookings,
│   │                            payments, attendance, analytics, misc
│   ├── jobs/scheduler.js       # Daily cron: renewal reminders + auto-billing
│   └── package.json
└── frontend/
    ├── index.html               # Member portal (register/login + dashboard)
    ├── admin.html                # Admin & trainer panel
    ├── css/style.css             # Shared "scoreboard" design system
    └── js/{api.js, app.js, admin.js}
```

## Getting started

```bash
cd backend
npm install
npm run seed     # creates & populates backend/db/gym.db with demo data
npm start         # starts the API + serves the frontend on http://localhost:4000
```

Then open **http://localhost:4000** in a browser.

- Member portal: `http://localhost:4000/index.html`
- Admin / trainer panel: `http://localhost:4000/admin.html`

### Demo logins (created by `npm run seed`)

| Role    | Email                  | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@flexzone.com      | admin123    |
| Trainer | arjun@flexzone.com      | trainer123  |
| Trainer | priya@flexzone.com      | trainer123  |
| Member  | ravi@example.com        | member123   |
| Member  | sneha@example.com       | member123   |

New members can also self-register from the member portal's "Join Now" tab.

## Feature coverage

**Core deliverables**
- Member registration & membership plan selection, with instant (simulated) payment capture.
- Class schedule with day/category/trainer filters and online booking.
- Trainer profiles and class assignment.
- Automated billing, renewal reminders, and QR-based attendance tracking.

**Advanced features**
- **Workout plans** — trainers assign structured routines per member.
- **Progress tracking** — members log weight/body-fat and see an SVG trend chart.
- **QR check-in** — each member gets a unique QR code (rendered server-side with the `qrcode` package); front desk staff check members in by scanning/entering the code.
- **Nutrition plans** — trainers attach meal plans with calorie counts.
- **Waitlist** — classes at capacity auto-waitlist new bookings; cancelling a confirmed spot auto-promotes the earliest waitlisted member and notifies them.
- **Locker management** — per-branch locker grid, claim/release, one locker per member.
- **Multi-branch** — branches, classes, lockers, and users are all branch-scoped; admins manage every branch from one dashboard.
- **Push-style notifications** — an in-app notification feed covers renewals, waitlist promotions, and class changes (see "Notes" below for real push).
- **Mobile responsiveness** — collapsible sidebar and responsive grids down to phone widths.
- **Analytics dashboard** — membership growth, class popularity, plan distribution, and revenue by month.
- **Payment gateway** — a mock Stripe/Razorpay charge function (`mockCharge`) simulates the gateway call; swap it for the real SDK in `routes/payments.js` and `jobs/scheduler.js`.
- **Auto-renewal billing** — a daily cron job (`jobs/scheduler.js`) charges members whose plan has `auto_renew` on and has reached its end date.
- **Prorated refund** — cancelling mid-cycle calculates `daily_rate × remaining_days` and records a refund payment.

## Notes on scope & production hardening

This is a complete, runnable reference implementation sized for a course/demo
project. Before running it for real members and payments, you'd want to:

1. Replace `mockCharge()` in `routes/payments.js` / `jobs/scheduler.js` with real Stripe or Razorpay SDK calls, and verify payments via webhooks instead of trusting client-driven success.
2. Replace the in-app notification feed with real push notifications (web push / FCM / APNs) and email/SMS for renewal reminders.
3. Move the JWT secret (`middleware/auth.js`) into an environment variable in production (a `.env.example` pattern is already wired via `dotenv`).
4. Add rate limiting, input validation middleware, and HTTPS termination.
5. Consider PostgreSQL/MySQL instead of SQLite if you need concurrent multi-writer scale across branches.
