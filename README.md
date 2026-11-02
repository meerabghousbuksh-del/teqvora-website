# TEQVORA website

Express + MongoDB backend that also serves the website and the admin dashboard.

## Run it

```bash
npm install
cp .env.example .env      # then fill in MONGODB_URI, ADMIN_PASSWORD, ADMIN_TOKEN_SECRET
npm start
```

- Website: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin/
- Health check: http://localhost:3000/api/health

Checks that need no database: `npm run check` (syntax of every JS file) and `npm test` (validation, admin token, rate limiter).

## Copy your images into `public/`

The image files were not part of the files used to build this project. Copy your own into `public/`
(same names as in the HTML): `logo.jpeg`, `about.avif`, `boy.jpg`, `amazon.jpg`, `tiktok.jpg`,
`shopify.jpg`, `etsy.jpg`, `uiux.avif` and `wal mart market place.jpg`. `hero.png` is already included.
In `public/teqvora.HTML` the review avatar `gir;.jpg` looks like a typo; point it at the real file name.

## Folder layout

```
server.js            entry point: connects MongoDB, then starts Express
app.js               middleware, routes, static files, error handling
config/              env.js (settings), db.js (MongoDB connection)
models/              Inquiry.js, Visit.js
controllers/         inquiry, analytics, admin logic
routes/              /api/contact, /api/analytics, /api/admin
middleware/          adminAuth, rateLimit, requireDatabase, errorHandler
utils/               validation, adminToken, mailer, constants
tests/               unit tests (node --test)
public/              the website: teqvora.HTML, service.html, css, js, admin/
```

## API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/contact` | Contact form and Strategy Audit (`type: "strategy-audit"`) |
| POST | `/api/analytics/visit` | One page view per page per browser session |
| POST | `/api/admin/login` | Returns an 8-hour admin token |
| GET | `/api/admin/stats` | Dashboard numbers (token required) |
| GET | `/api/admin/inquiries` | List, filter and search (token required) |
| PATCH | `/api/admin/inquiries/:id` | Change status: new, contacted, closed |
| DELETE | `/api/admin/inquiries/:id` | Delete an enquiry |

Email notifications are optional: set `SMTP_HOST` and `NOTIFY_EMAIL` in `.env`. Without them,
enquiries are still saved and the dashboard shows the email status as "skipped".
