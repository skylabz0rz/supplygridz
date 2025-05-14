import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { auth0_id, player, company } = req.body;

  if (!auth0_id || !player || !company) {
    return res.status(400).json({ error: 'Missing onboarding data' });
  }

  try {
    // 1. Find the player by auth0_id
    const playerResult = await pool.query(
      'SELECT id FROM players WHERE auth0_id = $1',
      [auth0_id]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const playerId = playerResult.rows[0].id;

    // 2. Update player profile
    await pool.query(
      'UPDATE players SET in_game_name = $1, sex = $2, ethnicity = $3, onboarding_complete = true WHERE id = $4',
      [player.in_game_name, player.sex, player.ethnicity, playerId]
    );

    // 3. Insert new company
    const insertCompany = await pool.query(
      'INSERT INTO companies (player_id, name, logo, hq_lat, hq_lng, policies) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        playerId,
        company.name,
        company.logo,
        company.hq_lat,
        company.hq_lng,
        JSON.stringify(company.policies)
      ]
    );

    res.json({ success: true, company: insertCompany.rows[0] });
  } catch (err) {
    console.error('POST /api/onboarding failed:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

export default router;
