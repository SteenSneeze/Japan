const express = require('express');
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.name AS city_name, u.display_name AS added_by_name, u.avatar_color AS added_by_color,
        COALESCE(json_agg(ap.user_id) FILTER (WHERE ap.user_id IS NOT NULL), '[]') AS paid_user_ids
       FROM accommodations a
       LEFT JOIN cities c ON a.city_id = c.id
       LEFT JOIN users u ON a.added_by = u.id
       LEFT JOIN accommodation_payments ap ON ap.accommodation_id = a.id
       GROUP BY a.id, c.name, u.display_name, u.avatar_color
       ORDER BY a.check_in ASC NULLS LAST, a.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/payments/:userId', requireAuth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { id, userId } = req.params;
  try {
    const existing = await pool.query(
      'SELECT id FROM accommodation_payments WHERE accommodation_id=$1 AND user_id=$2', [id, userId]
    );
    if (existing.rows.length) {
      await pool.query('DELETE FROM accommodation_payments WHERE accommodation_id=$1 AND user_id=$2', [id, userId]);
    } else {
      await pool.query('INSERT INTO accommodation_payments (accommodation_id, user_id) VALUES ($1, $2)', [id, userId]);
    }
    const result = await pool.query(
      `SELECT COALESCE(json_agg(user_id), '[]') AS paid_user_ids FROM accommodation_payments WHERE accommodation_id=$1`, [id]
    );
    res.json({ paid_user_ids: result.rows[0].paid_user_ids });
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
