# Japan Trip Planner

A collaborative trip planning site for the Japan group. Built with Express, React/Vite, and PostgreSQL.

## Stack

- **Backend**: Express.js (REST API)
- **Frontend**: React + Vite (served as static from Express in production)
- **Database**: PostgreSQL (Railway)
- **Auth**: JWT, per-user accounts, read-only public access

## Local development

```bash
# Install all dependencies
npm run install:all

# Create server/.env from the example
cp .env.example server/.env
# Edit server/.env with your local DATABASE_URL and a JWT_SECRET

# Run both dev servers (frontend on :5173, backend on :3001)
npm run dev
```

## Deploy to Railway

1. Push to GitHub
2. Create a new Railway project, connect the repo
3. Add a PostgreSQL service and copy the DATABASE_URL
4. Set environment variables in Railway:
   - `DATABASE_URL` (from the Postgres service)
   - `JWT_SECRET` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NODE_ENV=production`
5. Railway will use `nixpacks.toml` to build and start

The DB schema is created automatically on first boot.

## Creating accounts

Once deployed, sign in with any account and navigate to `/admin` to create accounts for each friend.

Suggested usernames: barney, cohen, mieke, neve, jd, joe, will, levi

## Structure

```
japan-trip/
  server/
    index.js          # Express entry point
    db.js             # PostgreSQL pool + schema init
    middleware/
      auth.js         # JWT middleware
    routes/
      auth.js         # Login, register, /me
      cities.js       # City CRUD
      places.js       # Place CRUD + voting + comments
      itinerary.js    # Trip days + itinerary items
  client/
    src/
      pages/
        HomePage.jsx
        PlanPage.jsx  # Compare/vote on places
        TripPage.jsx  # Day-by-day itinerary + map
        AdminPage.jsx # Create user accounts
      components/
        Nav.jsx
        PlaceCard.jsx
        AddPlaceModal.jsx
        LoginModal.jsx
      hooks/
        useAuth.jsx
      lib/
        api.js        # All API calls
```
