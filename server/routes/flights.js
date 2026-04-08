const express = require('express');
const { pool, auditLog } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, u.display_name AS added_by_name, u.avatar_color AS added_by_color,
        COALESCE(json_agg(fp.user_id) FILTER (WHERE fp.user_id IS NOT NULL), '[]') AS paid_user_ids
       FROM flights f
       LEFT JOIN users u ON f.added_by = u.id
       LEFT JOIN flight_payments fp ON fp.flight_id = f.id
       GROUP BY f.id, u.display_name, u.avatar_color
       ORDER BY f.departure_datetime ASC NULLS LAST, f.created_at ASC`
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
      'SELECT id FROM flight_payments WHERE flight_id=$1 AND user_id=$2', [id, userId]
    );
    if (existing.rows.length) {
      await pool.query('DELETE FROM flight_payments WHERE flight_id=$1 AND user_id=$2', [id, userId]);
    } else {
      await pool.query('INSERT INTO flight_payments (flight_id, user_id) VALUES ($1, $2)', [id, userId]);
    }
    const result = await pool.query(
      `SELECT COALESCE(json_agg(user_id), '[]') AS paid_user_ids FROM flight_payments WHERE flight_id=$1`, [id]
    );
    res.json({ paid_user_ids: result.rows[0].paid_user_ids });
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
    await auditLog(req.user.id, 'flight_added', `Added flight: ${from_location} → ${to_location}${airline ? ` (${airline}${flight_number ? ' ' + flight_number : ''})` : ''}`);
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
    const f = result.rows[0];
    await auditLog(req.user.id, 'flight_updated', `Updated flight: ${f.from_location} → ${f.to_location}${f.airline ? ` (${f.airline})` : ''}`);
    res.json(f);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT from_location, to_location, airline FROM flights WHERE id=$1', [req.params.id]);
    await pool.query('DELETE FROM flights WHERE id=$1', [req.params.id]);
    const f = existing.rows[0];
    await auditLog(req.user.id, 'flight_deleted', `Deleted flight: ${f?.from_location} → ${f?.to_location}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
