const express = require('express');
const db = require('../db');
const {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
} = require('../lib/auth');
const { attachUser } = require('../middleware/requireAuth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Name, email, and password are all required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = rows[0];
    const token = signToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    console.error('❌ signup error:', err.detail || err.message);
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { rows } = await db.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [normalizedEmail]
    );
    const row = rows[0];

    // Vague on purpose — don't reveal whether the email exists.
    if (!row) return res.status(401).json({ error: 'Incorrect email or password.' });

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect email or password.' });

    const user = { id: row.id, name: row.name, email: row.email };
    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    console.error('❌ login error:', err.detail || err.message);
    res.status(500).json({ error: 'Something went wrong logging in.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me — never errors for guests, just reports who's logged in
router.get('/me', attachUser, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
