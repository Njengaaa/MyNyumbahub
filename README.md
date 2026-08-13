# Nyumbahub — Redesign

A modern redesign of the Nyumbahub concept: real login/register (Supabase Auth),
a real Postgres database (Supabase), role-based Tenant/Landlord dashboards, and
an interactive Leaflet map of Nairobi & Kiambu listings.

## What's different from the group repo

- **Real authentication** — accounts persist in an actual database, not in-memory mock data.
- **Two account types** — Tenant and Landlord, with separate dashboards and permissions.
- **Landlords can add/delete their own listings** from a dashboard form.
- **Tenants can request bookings**, and landlords can confirm/decline them.
- **Interactive map** of all listings across Nairobi & Kiambu (Leaflet + OpenStreetMap, free, no API key).
- New visual design (different fonts, colors, and layout from the group repo).

## 1. Set up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. In your project, go to **SQL Editor** → **New query**.
3. Paste the contents of `supabase/schema.sql` and click **Run**. This creates the
   `profiles`, `listings`, and `bookings` tables, plus the security rules and the
   trigger that auto-creates a profile when someone signs up.
4. Run a second query with the contents of `supabase/seed.sql` to add sample listings.
5. Go to **Settings → API** in your Supabase project. Copy the **Project URL** and
   the **anon public** key — you'll need them next.

## 2. Configure the project

```bash
cp .env.example .env
```

Open `.env` and paste in your Supabase URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`.env` is already in `.gitignore` — it will never be pushed to GitHub, so your keys stay private.

## 3. Install and run

```bash
npm install
npm run dev
```

Open the local URL it prints. Try registering as both a Tenant and a Landlord
(use two different emails) to see both dashboards.

> **Note:** By default, Supabase requires email confirmation before login. For a
> class project, it's usually easier to turn this off: in your Supabase dashboard,
> go to **Authentication → Providers → Email** and disable "Confirm email".

## 4. Push this to your own GitHub repo

```bash
git init
git add .
git commit -m "Initial commit: Nyumbahub redesign with Supabase auth and map"
```

Create a new empty repo on GitHub (github.com → New repository), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

## 5. (Optional) Deploy it live

Since this is a real backend (Supabase), you can deploy the frontend for free and
share a live link with your group:

1. Push the repo to GitHub (step 4 above).
2. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo.
3. In the deployment settings, add the same two environment variables from your
   `.env` file (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Deploy. You'll get a live URL to share.

## Project structure

```
src/
  areaCoords.js         Nairobi/Kiambu neighbourhood → lat/lng lookup
  supabaseClient.js      Supabase connection
  context/AuthContext.jsx  Login/register/logout + current user's role
  components/
    Navbar, Footer
    ListingsMap           interactive map
    ListingCard            listing preview card
    ProtectedRoute          route guard (login required, optional role check)
  pages/
    Home                    marketing page + map + featured listings
    Listings                browse/search all listings
    ListingDetail           single listing + booking request
    Login, Register        auth forms
    TenantDashboard        tenant's booking requests
    LandlordDashboard      landlord's listings + incoming bookings
    AddListing             landlord's "add a new listing" form
supabase/
  schema.sql              database tables + security rules
  seed.sql                sample listings
```
