const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/items - Get all donation items
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT items.*, users.name as donor_name FROM items JOIN users ON items.donor_id = users.id ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items - Create a new donation item (requires login)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, category, condition, location, description, image_url } = req.body;

    if (!title || !category || !condition || !location || !description) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const { rows } = await db.query(
      `INSERT INTO items (title, category, condition, location, description, image_url, donor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, category, condition, location, description, image_url || null, req.user.id]
    );

    // req.user.id came from the verified session — not something a
    // client can spoof by passing a different donor_id in the body.
    res.status(201).json({ ...rows[0], donor_name: req.user.name });
  } catch (err) {
    console.error('❌ Detailed Database Error:', err.detail || err.message);
    res.status(500).json({ error: err.detail || err.message });
  }
});

module.exports = router;
