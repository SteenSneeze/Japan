const express = require('express');
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.name AS city_name, u.display_name AS added_by_name, u.avatar_color AS added_by_color
       FROM accommodations a
       LEFT JOIN cities c ON a.city_id = c.id
       LEFT JOIN users u ON a.added_by = u.id
       ORDER BY a.check_in ASC NULLS LAST, a.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { city_id, name, address, check_in, check_out, booking_reference, price_per_night, total_price, url, notes, status } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = await pool.query(
      `INSERT INTO accommodations (city_id, name, address, check_in, check_out, booking_reference, price_per_night, total_price, url, notes, status, added_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [city_id || null, name, address, check_in || null, check_out || null, booking_reference, price_per_night, total_price, url, notes, status || 'considering', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { city_id, name, address, check_in, check_out, booking_reference, price_per_night, total_price, url, notes, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE accommodations SET
        city_id=$1,
        name=COALESCE($2,name),
        address=COALESCE($3,address),
        check_in=$4,
        check_out=$5,
        booking_reference=COALESCE($6,booking_reference),
        price_per_night=COALESCE($7,price_per_night),
        total_price=COALESCE($8,total_price),
        url=COALESCE($9,url),
        notes=COALESCE($10,notes),
        status=COALESCE($11,status)
       WHERE id=$12 RETURNING *`,
      [city_id || null, name, address, check_in || null, check_out || null, booking_reference, price_per_night, total_price, url, notes, status, req.params.id]
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
    await pool.query('DELETE FROM accommodations WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
