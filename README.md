# Freecycle

A neighborhood donation board — post items with a real photo, search and
filter what's available, request items from other members, and chat about
pickup. Built with React (client) + Express (server) + PostgreSQL (Neon).

## What's here

- **Auth** — signup/login with bcrypt-hashed passwords, sessions via an
  HttpOnly JWT cookie
- **Items** — post donations with a real uploaded photo (or a pasted image
  URL), browse with search + category filters
- **Claims** — request an item; the server blocks claiming your own item or
  a double-claim, using a database transaction
- **Chat** — requesting an item opens a real conversation thread, with an
  unread-messages badge in the header
- **Design** — a full visual pass (moss/ochre theme, modal-based forms, item
  cards) instead of the plain functional version this started as

## Project structure

```
freecycle/
├── server/                  Express API
│   ├── app.js                  the actual Express app (routes, middleware)
│   ├── server.js               local dev only — imports app.js and listens
│   ├── api/
│   │   └── [...path].js        Vercel's entry point — hands every
│   │                            request to the same Express app above
│   ├── db.js                   Postgres connection pool
│   ├── routes/
│   │   ├── auth.js               signup, login, logout, session check
│   │   ├── items.js              list + create items
│   │   ├── claims.js             request an item (creates a conversation too)
│   │   ├── conversations.js      list conversations, read/send messages
│   │   └── upload.js             image upload (Vercel Blob storage)
│   ├── middleware/
│   │   └── requireAuth.js        checks the login cookie
│   ├── lib/
│   │   └── auth.js               password hashing, JWT, cookies
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.sql              optional sample data
│   └── .env.example
└── client/                  React frontend (Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── App.css               design system (moss/ochre theme)
    │   ├── api/client.js         fetch wrapper for the API
    │   ├── context/AuthContext.jsx
    │   └── components/
    │       ├── AuthModal.jsx
    │       ├── PostItemModal.jsx
    │       ├── ClaimModal.jsx
    │       ├── ItemCard.jsx
    │       ├── CategoryTag.jsx
    │       ├── StatusStamp.jsx
    │       └── Messages.jsx
    └── .env.example
```

## 1. Set up the database

1. Create a free Postgres database at [neon.tech](https://neon.tech) — it
   gives you a connection string right away
2. Run `server/db/schema.sql` against it (Neon's dashboard has a built-in SQL
   editor, or use `psql` / TablePlus / any Postgres client)
3. Optionally also run `server/db/seed.sql` for a demo login
   (`demo@example.com` / `demo1234`) and one sample item

## 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

In `server/.env`, fill in:
- `DATABASE_URL` — your Neon connection string
- `JWT_SECRET` — any long random string (`openssl rand -base64 32`)
- `CLIENT_URL` — leave as `http://localhost:5173` for local dev
- `BLOB_READ_WRITE_TOKEN` — from a Blob store in your Vercel dashboard's
  Storage tab (needed even for local dev, since uploads go straight to
  Blob rather than local disk)

`client/.env` can stay as-is for local dev (`VITE_API_URL=http://localhost:5000`).

## 3. Install and run

In one terminal:
```bash
cd server
npm install
npm run dev
```

In another terminal:
```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## 4. Try it out

1. Create an account (or sign in with the demo login)
2. Click **+ Donate an item**, upload a real photo (or paste an image URL),
   and post it
3. Try the search box and category sidebar to filter the board
4. Sign out, create a second account, and click **Request item** on
   something the first account posted — notice it's blocked if you try to
   request your own item
5. Click into **Messages** to see the conversation created automatically —
   the header shows an unread badge when there's a new message waiting.
   Reply as the donor by switching accounts (or use a second browser /
   incognito window)

## How auth works

- Passwords are hashed with bcrypt before being stored — the plain password
  is never saved
- On login/signup, the server signs a JWT and sets it as an HttpOnly cookie
  (`freecycle_token`) — JavaScript in the browser can't read it, which
  protects against a common attack (XSS token theft)
- Every protected route (`requireAuth` middleware) reads that cookie,
  verifies it, and attaches `req.user` — so routes never trust a
  client-supplied user ID for anything security-sensitive (who posted an
  item, who sent a message, etc.)
- Because the client (port 5173) and server (port 5000) are different
  origins, CORS is configured with a specific origin + `credentials: true`,
  and the cookie is set with `SameSite=Lax` locally / `SameSite=None; Secure`
  in production — both are required for the cookie to actually travel
  between them

## How image uploads work

- Photos are uploaded to **Vercel Blob** (public object storage), not saved
  to local disk — this matters because a Vercel serverless function has no
  persistent filesystem between requests, so local disk storage wouldn't
  survive from one upload to the next request that tries to display it
- Create a Blob store from your Vercel dashboard's **Storage** tab, copy the
  token it gives you into `BLOB_READ_WRITE_TOKEN` — this same token works
  both locally and in production, so there's only one storage path to
  think about, not a "works differently in dev vs. prod" situation
- Uploads are capped at 5MB and restricted to JPEG/PNG/WEBP/GIF
- The upload route returns a real `https://...` URL directly from Blob —
  the frontend just uses it as-is

## Deploying — both pieces go on Vercel

This is two separate Vercel projects from the same repo, since the client
(static site) and server (API) deploy independently.

1. **Create a Blob store first** — Vercel dashboard → Storage → Create →
   Blob. Copy the token it gives you.
2. **Deploy the server**: New Project → import this repo → set **Root
   Directory** to `server`. Add environment variables: `DATABASE_URL`,
   `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`, and `CLIENT_URL` (set to a
   placeholder for now). Deploy, then copy the URL it gives you.
3. **Deploy the client**: New Project → import this repo again → set
   **Root Directory** to `client`. Add environment variable `VITE_API_URL`
   set to the server URL from step 2. Deploy, then copy this URL too.
4. **Go back to the server project's environment variables** and update
   `CLIENT_URL` to the real client URL from step 3 — then redeploy the
   server (Vercel → Deployments → ⋯ → Redeploy). This step matters: until
   it's set correctly, CORS will block every request from the live site,
   the same way it did locally before `CLIENT_URL` was configured.
5. Visit your client's URL and test the full flow — signup, posting an
   item with a real photo, requesting it from a second account, and chat.

From here on, every `git push` to `main` automatically redeploys both
projects.

## Known limitations / good next steps

- No password reset flow
- Chat updates via polling (checks for new messages every few seconds),
  not true real-time — fine at this scale, would want WebSockets or a
  service like Pusher/Ably for something snappier at larger scale
- No pagination — fine for a small board, would need it at scale
- No rate limiting on signup/login (a real production app would add this
  to slow down brute-force attempts)
