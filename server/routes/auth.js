const express = require('express');
const db = require('../db');
const {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
} = require('../lib/auth');
const { requireAuth, attachUser } = require('../middleware/requireAuth');

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

// GET /api/auth/me
router.get('/me', attachUser, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/profile - update display name
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    const { rows } = await db.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email',
      [name.trim(), req.user.id]
    );

    const user = rows[0];
    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    console.error('❌ update profile error:', err.detail || err.message);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/auth/change-password - change password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const valid = await verifyPassword(currentPassword, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('❌ change password error:', err.detail || err.message);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// GET /api/auth/stats - get user activity stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const donationsResult = await db.query(
      'SELECT COUNT(*) as count FROM items WHERE donor_id = $1',
      [req.user.id]
    );
    const claimsResult = await db.query(
      'SELECT COUNT(*) as count FROM claims WHERE claimant_id = $1',
      [req.user.id]
    );

    res.json({
      donationsCount: parseInt(donationsResult.rows[0].count, 10) || 0,
      claimsCount: parseInt(claimsResult.rows[0].count, 10) || 0,
    });
  } catch (err) {
    console.error('❌ stats error:', err.detail || err.message);
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

module.exports = router;