const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Get all donation items
app.get('/api/items', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT items.*, users.name as donor_name FROM items JOIN users ON items.donor_id = users.id ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch chat messages for a conversation
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT m.*, u.name as sender_name 
       FROM messages m 
       JOIN users u ON m.sender_id = u.id 
       WHERE m.conversation_id = $1 
       ORDER BY m.created_at ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// POST /api/items - Create a new donation item
app.post('/api/items', async (req, res) => {
  try {
    const { title, category, condition, location, description, image_url, donor_id } = req.body;

    if (!title || !category || !condition || !location || !description) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const { rows } = await db.query(
      `INSERT INTO items (title, category, condition, location, description, image_url, donor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, category, condition, location, description, image_url || null, donor_id || 1]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    // PRINT THE EXACT ERROR IN YOUR TERMINAL SO WE KNOW WHY IT FAILED
    console.error('❌ Detailed Database Error:', err.detail || err.message);
    res.status(500).json({ error: err.detail || err.message });
  }
});
// Post a new chat message
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, content } = req.body;
    
    const { rows } = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, senderId, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));