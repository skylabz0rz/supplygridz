import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

// GET all players from the real database
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/players failed:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/players/login
router.post('/login', async (req, res) => {
  const { auth0_id, name, email } = req.body;

  if (!auth0_id || !name || !email) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const existing = await pool.query('SELECT * FROM players WHERE auth0_id = $1', [auth0_id]);

    if (existing.rows.length > 0) {
      return res.json({ player: existing.rows[0], exists: true });
    }

    const insert = await pool.query(
      'INSERT INTO players (auth0_id, in_game_name) VALUES ($1, $2) RETURNING *',
      [auth0_id, name]
    );

    res.json({ player: insert.rows[0], exists: false });
  } catch (err) {
    console.error('POST /login failed:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

export default router;
