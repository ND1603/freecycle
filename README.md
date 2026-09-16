# Freecycle

A neighborhood donation board — post items, browse what's available, request
items from other members, and chat with them about pickup. Built with
React (client) + Express (server) + PostgreSQL (Neon).

## Project structure

```
freecycle/
├── server/                  Express API
│   ├── server.js              entry point — wires up routes
│   ├── db.js                  Postgres connection pool
│   ├── routes/
│   │   ├── auth.js              signup, login, logout, session check
│   │   ├── items.js             list + create items
│   │   ├── claims.js            request an item (creates a conversation too)
│   │   └── conversations.js     list conversations, read/send messages
│   ├── middleware/
│   │   └── requireAuth.js       checks the login cookie
│   ├── lib/
│   │   └── auth.js              password hashing, JWT, cookies
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.sql             optional sample data
│   └── .env.example
└── client/                  React frontend (Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── api/client.js        fetch wrapper for the API
    │   ├── context/AuthContext.jsx
    │   └── components/
    │       ├── AuthForm.jsx
    │       ├── AddItemForm.jsx
    │       ├── ClaimForm.jsx
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
2. Post an item with **Post an Item to Donate**
3. Sign out, create a second account, and click **Request this item** on
   something the first account posted
4. Click into **Messages** to see the conversation that was created
   automatically — reply as the donor by switching accounts (or use a
   second browser / incognito window)

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

## Known limitations / good next steps

- No image upload — paste an image URL when posting, or leave blank
- No password reset flow
- Chat updates via polling (checks for new messages every few seconds),
  not true real-time — fine at this scale, would want WebSockets or a
  service like Pusher/Ably for something snappier at larger scale
- Styling is intentionally plain right now — happy to apply a real design
  pass once the functionality feels solid
