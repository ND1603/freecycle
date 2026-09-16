const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// POST /api/claims - request an item (requires login)
router.post('/', requireAuth, async (req, res) => {
  const { itemId, contact, message } = req.body;
  if (!itemId || !contact?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Contact info and a message are required.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Lock the row so two people can't claim the same item at the same
    // instant — the second request will wait here until the first
    // transaction commits or rolls back, then see the updated status.
    const itemResult = await client.query(
      'SELECT id, donor_id, status, title FROM items WHERE id = $1 FOR UPDATE',
      [itemId]
    );
    const item = itemResult.rows[0];

    if (!item) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'That item no longer exists.' });
    }
    if (item.donor_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "You can't request your own donation." });
    }
    if (item.status !== 'Available') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'That item has already been claimed.' });
    }

    const claimResult = await client.query(
      `INSERT INTO claims (item_id, claimant_id, contact, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [itemId, req.user.id, contact.trim(), message.trim()]
    );

    await client.query("UPDATE items SET status = 'Claimed' WHERE id = $1", [itemId]);

    // Find or create the conversation for this (item, claimant) pair
    let convResult = await client.query(
      'SELECT id FROM conversations WHERE item_id = $1 AND claimant_id = $2',
      [itemId, req.user.id]
    );
    let conversationId;
    if (convResult.rows.length > 0) {
      conversationId = convResult.rows[0].id;
    } else {
      const created = await client.query(
        'INSERT INTO conversations (item_id, donor_id, claimant_id) VALUES ($1, $2, $3) RETURNING id',
        [itemId, item.donor_id, req.user.id]
      );
      conversationId = created.rows[0].id;
    }

    // Drop the claim message in as the first chat message
    await client.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)',
      [conversationId, req.user.id, message.trim()]
    );

    await client.query('COMMIT');
    res.status(201).json({ claim: claimResult.rows[0], conversationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ create claim error:', err.detail || err.message);
    res.status(500).json({ error: "Couldn't send your request." });
  } finally {
    client.release();
  }
});

module.exports = router;
