const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/days', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, c.name AS city_name, c.lat AS city_lat, c.lng AS city_lng,
        json_agg(
          json_build_object(
            'id', i.id,
            'place_id', i.place_id,
            'place_name', p.name,
            'place_category', p.category,
            'place_lat', p.lat,
            'place_lng', p.lng,
            'custom_title', i.custom_title,
            'custom_description', i.custom_description,
            'start_time', i.start_time,
            'end_time', i.end_time,
            'order_index', i.order_index
          ) ORDER BY i.order_index, i.start_time
        ) FILTER (WHERE i.id IS NOT NULL) AS items
      FROM trip_days d
      LEFT JOIN cities c ON d.city_id = c.id
      LEFT JOIN itinerary_items i ON i.day_id = d.id
      LEFT JOIN places p ON i.place_id = p.id
      GROUP BY d.id, c.name, c.lat, c.lng
      ORDER BY d.date
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/days', requireAuth, async (req, res) => {
  const { date, city_id, label, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  try {
    const result = await pool.query(
      `INSERT INTO trip_days (date, city_id, label, notes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [date, city_id, label, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/days/:id', requireAuth, async (req, res) => {
  const { date, city_id, label, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE trip_days SET date=COALESCE($1,date), city_id=COALESCE($2,city_id),
       label=COALESCE($3,label), notes=COALESCE($4,notes) WHERE id=$5 RETURNING *`,
      [date, city_id, label, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/days/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM trip_days WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/days/:dayId/items', requireAuth, async (req, res) => {
  const { place_id, custom_title, custom_description, start_time, end_time, order_index } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO itinerary_items (day_id, place_id, custom_title, custom_description, start_time, end_time, order_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.dayId, place_id, custom_title, custom_description, start_time, end_time, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/items/:id', requireAuth, async (req, res) => {
  const { custom_title, custom_description, start_time, end_time, order_index, day_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE itinerary_items SET
        custom_title=COALESCE($1,custom_title), custom_description=COALESCE($2,custom_description),
        start_time=COALESCE($3,start_time), end_time=COALESCE($4,end_time),
        order_index=COALESCE($5,order_index), day_id=COALESCE($6,day_id)
       WHERE id=$7 RETURNING *`,
      [custom_title, custom_description, start_time, end_time, order_index, day_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/items/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM itinerary_items WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
