# OUTY

Discover the best places and events around Morocco. OUTY is a full-stack MVP designed for Replit with a PostgreSQL backend, React frontend, and Cloudinary-ready media support.

## Getting started on Replit
1. Create a new Replit from this repo.
2. Add the environment variables shown in `.env.example` via the **Secrets** panel.
3. Enable PostgreSQL in the Replit workspace (Tools → Database → PostgreSQL). Copy the generated connection string into `DATABASE_URL`.
4. Install dependencies with `npm install` (run once). If your network needs a proxy, configure it before installing.
5. Run `npm run dev` to start both the API (Express) and the Vite dev server. Replit will expose the frontend URL automatically; the backend runs on port `3000`.

## Scripts
- `npm run dev` – start API with hot reload + Vite client
- `npm run dev:server` – start API only
- `npm run dev:client` – start Vite only
- `npm run build` – production build for the client
- `npm run seed` – run database migrations + seed sample data

## Environment variables
See `.env.example` for all variables. At minimum set:
- `DATABASE_URL` – Replit PostgreSQL connection string
- `JWT_SECRET` – random string for tokens
- `CLOUDINARY_URL` – Cloudinary API URL (for uploads if you wire it)

## Architecture
- **Backend**: `server/` contains Express API, JWT auth, reservations, reviews, and QR code generation. Tables auto-create on boot via `initDb()`, and `seedData()` populates demo places/events and a sample review.
- **Frontend**: `client/` is a Vite React SPA with pages for public discovery, reservations, verification, and business dashboards.
- **Database**: PostgreSQL tables follow the provided schema (users, places, events, media, reservations, reviews).

## Demo accounts
- Business host: `host@outy.ma` / password `outy123`
- User: `user@outy.ma` / password `outy123`

## Cloudinary
Upload files to Cloudinary manually and paste the resulting URLs into place/event media or menus. The backend stores URLs only.

## Verification & QR
Reservations created in OUTY mode return a QR code that points to `/verify/:code`. Hosts can change status to CHECKED_IN from the dashboard.

