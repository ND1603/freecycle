const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

async function loadConversation(id) {
  const { rows } = await db.query(
    `SELECT c.id, c.item_id, c.donor_id, c.claimant_id,
            items.title AS item_title,
            donor.name AS donor_name,
            claimant.name AS claimant_name
     FROM conversations c
     JOIN items ON items.id = c.item_id
     JOIN users donor ON donor.id = c.donor_id
     JOIN users claimant ON claimant.id = c.claimant_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0] || null;
}

// GET /api/conversations - list all conversations the logged-in user is part of
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         c.id, c.item_id, c.donor_id, c.claimant_id, c.created_at,
         items.title AS item_title,
         items.image_url AS item_image_url,
         donor.name AS donor_name,
         claimant.name AS claimant_name,
         lm.content AS last_message_content,
         lm.created_at AS last_message_at
       FROM conversations c
       JOIN items ON items.id = c.item_id
       JOIN users donor ON donor.id = c.donor_id
       JOIN users claimant ON claimant.id = c.claimant_id
       LEFT JOIN LATERAL (
         SELECT content, created_at FROM messages
         WHERE messages.conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
       ) lm ON true
       WHERE c.donor_id = $1 OR c.claimant_id = $1
       ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ list conversations error:', err.detail || err.message);
    res.status(500).json({ error: "Couldn't load your messages." });
  }
});

// GET /api/conversations/:id/messages - fetch chat messages for a conversation
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await loadConversation(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    if (conversation.donor_id !== req.user.id && conversation.claimant_id !== req.user.id) {
      return res.status(403).json({ error: "You don't have access to this conversation." });
    }

    const { rows } = await db.query(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );
    res.json({ conversation, messages: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conversations/:id/messages - post a new chat message
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const conversation = await loadConversation(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    if (conversation.donor_id !== req.user.id && conversation.claimant_id !== req.user.id) {
      return res.status(403).json({ error: "You don't have access to this conversation." });
    }

    // sender_id comes from the verified session (req.user.id), not from
    // the request body — otherwise anyone could send messages pretending
    // to be someone else just by changing the senderId field.
    const { rows } = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, req.user.id, content.trim()]
    );
    res.status(201).json({ ...rows[0], sender_name: req.user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
