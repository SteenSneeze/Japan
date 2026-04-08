const express = require('express');
const { pool, auditLog } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/seed-days', requireAuth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { start, end } = req.body;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });
  try {
    const startDate = new Date(start + 'T12:00:00');
    const endDate   = new Date(end   + 'T12:00:00');
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ error: 'Invalid date range' });
    }
    const inserted = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().slice(0, 10);
      const result = await pool.query(
        `INSERT INTO trip_days (date) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id, date`,
        [date]
      );
      if (result.rows.length) inserted.push(date);
    }
    await auditLog(req.user.id, 'days_seeded', `Bulk-added ${inserted.length} days (${start} → ${end})`);
    res.json({ inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/days/all', requireAuth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  try {
    const count = await pool.query('SELECT COUNT(*) FROM trip_days');
    await pool.query('DELETE FROM trip_days');
    await auditLog(req.user.id, 'days_cleared', `Deleted all ${count.rows[0].count} trip days`);
    res.json({ deleted: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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
    const city = city_id ? await pool.query('SELECT name FROM cities WHERE id=$1', [city_id]) : null;
    const cityName = city?.rows[0]?.name;
    await auditLog(req.user.id, 'day_added', `Added day: ${date}${cityName ? ` — ${cityName}` : ''}${label ? ` (${label})` : ''}`);
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
    await auditLog(req.user.id, 'day_updated', `Updated day: ${result.rows[0]?.date}`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/days/:id', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT date, label FROM trip_days WHERE id=$1', [req.params.id]);
    await pool.query('DELETE FROM trip_days WHERE id=$1', [req.params.id]);
    const day = existing.rows[0];
    await auditLog(req.user.id, 'day_deleted', `Deleted day: ${day?.date}${day?.label ? ` (${day.label})` : ''}`);
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
    const day = await pool.query('SELECT date FROM trip_days WHERE id=$1', [req.params.dayId]);
    let itemName = custom_title;
    if (place_id) {
      const place = await pool.query('SELECT name FROM places WHERE id=$1', [place_id]);
      itemName = place.rows[0]?.name;
    }
    await auditLog(req.user.id, 'item_added', `Added "${itemName}" to day ${day.rows[0]?.date}`);
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
    await auditLog(req.user.id, 'item_updated', `Updated itinerary item "${custom_title || `#${req.params.id}`}"`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/items/:id', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query(
      `SELECT i.custom_title, p.name AS place_name, d.date
       FROM itinerary_items i
       LEFT JOIN places p ON i.place_id = p.id
       LEFT JOIN trip_days d ON i.day_id = d.id
       WHERE i.id=$1`, [req.params.id]
    );
    await pool.query('DELETE FROM itinerary_items WHERE id=$1', [req.params.id]);
    const item = existing.rows[0];
    const itemName = item?.custom_title || item?.place_name || `#${req.params.id}`;
    await auditLog(req.user.id, 'item_deleted', `Removed "${itemName}" from day ${item?.date}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
