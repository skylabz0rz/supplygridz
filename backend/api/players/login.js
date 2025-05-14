import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

// Handle login + ensure player is in DB
router.post('/login', async (req, res) => {
  const { auth0_id, name, email } = req.body;

  if (!auth0_id || !name || !email) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Check if player exists
    const existing = await pool.query('SELECT * FROM players WHERE auth0_id = $1', [auth0_id]);

    if (existing.rows.length > 0) {
      return res.json({ player: existing.rows[0], exists: true });
    }

    // Create player
    const insert = await pool.query(
      'INSERT INTO players (auth0_id, in_game_name) VALUES ($1, $2) RETURNING *',
      [auth0_id, name]
    );

    res.json({ player: insert.rows[0], exists: false });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
