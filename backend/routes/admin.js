import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

// Home - list all tables
router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type='BASE TABLE';
  `);
  res.render('tables', { tables: result.rows });
});

// View specific table
router.get('/:table', async (req, res) => {
  const { table } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY id LIMIT 100`);
    res.render('view', { table, rows: result.rows, columns: result.fields.map(f => f.name) });
  } catch (err) {
    res.status(500).send(`Error fetching table ${table}: ${err.message}`);
  }
});

// Add entry form
router.get('/:table/add', async (req, res) => {
  const { table } = req.params;
  const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [table]);
  res.render('form', { table, mode: 'add', columns: cols.rows.map(r => r.column_name), values: {} });
});

// Add entry POST
router.post('/:table/add', async (req, res) => {
  const { table } = req.params;
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  const cols = keys.join(', ');
  const params = keys.map((_, i) => `$${i + 1}`).join(', ');

  try {
    await pool.query(`INSERT INTO ${table} (${cols}) VALUES (${params})`, values);
    res.redirect(`/admin/${table}`);
  } catch (err) {
    res.status(500).send(`Insert failed: ${err.message}`);
  }
});

// Edit entry form
router.get('/:table/edit/:id', async (req, res) => {
  const { table, id } = req.params;
  const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  const cols = Object.keys(result.rows[0]);
  res.render('form', { table, mode: 'edit', columns: cols, values: result.rows[0] });
});

// Edit POST
router.post('/:table/edit/:id', async (req, res) => {
  const { table, id } = req.params;
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  try {
    await pool.query(`UPDATE ${table} SET ${sets} WHERE id = $${keys.length + 1}`, [...values, id]);
    res.redirect(`/admin/${table}`);
  } catch (err) {
    res.status(500).send(`Update failed: ${err.message}`);
  }
});

// Delete entry
router.get('/:table/delete/:id', async (req, res) => {
  const { table, id } = req.params;
  try {
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.redirect(`/admin/${table}`);
  } catch (err) {
    res.status(500).send(`Delete failed: ${err.message}`);
  }
});

export default router;
