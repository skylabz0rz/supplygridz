// backend/api/onboarding.js
import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
  const { player, company, property, vehicle } = req.body;
  const auth0_id = req.auth?.sub || 'debug|local'; // fallback for testing

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert player if not exists
    let result = await client.query('SELECT id FROM players WHERE auth0_id = $1', [auth0_id]);
    let player_id;
    if (result.rows.length > 0) {
      player_id = result.rows[0].id;
    } else {
      result = await client.query(
        'INSERT INTO players (auth0_id, in_game_name, sex, ethnicity, city, state, onboarding_complete) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id',
        [auth0_id, player.name, player.sex, player.ethnicity, player.city, player.state]
      );
      player_id = result.rows[0].id;
    }

    // Create company
    result = await client.query(
      'INSERT INTO companies (player_id, name, structure, city, state) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [player_id, company.name, company.structure || 'LLC', player.city, player.state]
    );
    const company_id = result.rows[0].id;

    // Create property
    await client.query(
      'INSERT INTO properties (company_id, address, garage_level, rent) VALUES ($1, $2, $3, $4)',
      [company_id, property.address, property.garage_level, property.rent]
    );

    // Create vehicle
    await client.query(
      'INSERT INTO vehicles (company_id, type, lease) VALUES ($1, $2, $3)',
      [company_id, vehicle.type, vehicle.lease]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Onboarding submission failed:', err);
    res.status(500).json({ error: 'DB error' });
  } finally {
    client.release();
  }
});

export default router;
