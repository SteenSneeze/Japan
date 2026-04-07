const express = require('express');
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, u.display_name AS added_by_name, u.avatar_color AS added_by_color
       FROM flights f
       LEFT JOIN users u ON f.added_by = u.id
       ORDER BY f.departure_datetime ASC NULLS LAST, f.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { airline, flight_number, from_location, to_location, departure_datetime, arrival_datetime, booking_reference, price, notes } = req.body;
  if (!from_location || !to_location) return res.status(400).json({ error: 'from_location and to_location required' });
  try {
    const result = await pool.query(
      `INSERT INTO flights (airline, flight_number, from_location, to_location, departure_datetime, arrival_datetime, booking_reference, price, notes, added_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [airline, flight_number, from_location, to_location, departure_datetime || null, arrival_datetime || null, booking_reference, price, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { airline, flight_number, from_location, to_location, departure_datetime, arrival_datetime, booking_reference, price, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE flights SET
        airline=COALESCE($1,airline),
        flight_number=COALESCE($2,flight_number),
        from_location=COALESCE($3,from_location),
        to_location=COALESCE($4,to_location),
        departure_datetime=$5,
        arrival_datetime=$6,
        booking_reference=COALESCE($7,booking_reference),
        price=COALESCE($8,price),
        notes=COALESCE($9,notes)
       WHERE id=$10 RETURNING *`,
      [airline, flight_number, from_location, to_location, departure_datetime || null, arrival_datetime || null, booking_reference, price, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM flights WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
