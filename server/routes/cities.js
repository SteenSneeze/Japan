const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cities ORDER BY order_index, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { name, lat, lng, order_index } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = await pool.query(
      `INSERT INTO cities (name, lat, lng, order_index) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, lat, lng, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, lat, lng, order_index } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cities SET name=COALESCE($1,name), lat=COALESCE($2,lat), lng=COALESCE($3,lng), order_index=COALESCE($4,order_index)
       WHERE id=$5 RETURNING *`,
      [name, lat, lng, order_index, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cities WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
