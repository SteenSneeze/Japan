const express = require('express');
const { pool, auditLog } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  const { city_id, category, status } = req.query;
  const userId = req.user?.id || null;
  try {
    let query = `
      SELECT p.*,
        u.display_name AS added_by_name,
        u.avatar_color AS added_by_color,
        COALESCE(SUM(v.vote), 0) AS vote_score,
        COUNT(DISTINCT v.id) AS vote_count,
        MAX(CASE WHEN v.user_id = $1 THEN v.vote END) AS my_vote,
        COUNT(DISTINCT c.id) AS comment_count
      FROM places p
      LEFT JOIN users u ON p.added_by = u.id
      LEFT JOIN votes v ON v.place_id = p.id
      LEFT JOIN comments c ON c.place_id = p.id
      WHERE 1=1
    `;
    const params = [userId];
    let i = 2;
    if (city_id) { query += ` AND p.city_id = $${i++}`; params.push(city_id); }
    if (category) { query += ` AND p.category = $${i++}`; params.push(category); }
    if (status) { query += ` AND p.status = $${i++}`; params.push(status); }
    query += ' GROUP BY p.id, u.display_name, u.avatar_color ORDER BY vote_score DESC, p.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { city_id, category, name, description, address, lat, lng, price_range, url, image_url } = req.body;
  if (!category || !name) return res.status(400).json({ error: 'category and name required' });
  try {
    const result = await pool.query(
      `INSERT INTO places (city_id, category, name, description, address, lat, lng, price_range, url, image_url, added_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [city_id, category, name, description, address, lat, lng, price_range, url, image_url, req.user.id]
    );
    await auditLog(req.user.id, 'place_added', `Added place "${name}" (${category})`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, description, address, lat, lng, price_range, url, image_url, status, city_id, category } = req.body;
  try {
    const existing = await pool.query('SELECT name, status FROM places WHERE id=$1', [req.params.id]);
    const result = await pool.query(
      `UPDATE places SET
        name=COALESCE($1,name), description=COALESCE($2,description), address=COALESCE($3,address),
        lat=COALESCE($4,lat), lng=COALESCE($5,lng), price_range=COALESCE($6,price_range),
        url=COALESCE($7,url), image_url=COALESCE($8,image_url), status=COALESCE($9,status),
        city_id=COALESCE($10,city_id), category=COALESCE($11,category)
       WHERE id=$12 RETURNING *`,
      [name, description, address, lat, lng, price_range, url, image_url, status, city_id, category, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const placeName = existing.rows[0]?.name || name;
    const prevStatus = existing.rows[0]?.status;
    if (status && status !== prevStatus) {
      await auditLog(req.user.id, 'place_status_changed', `Moved "${placeName}" to ${status}`);
    } else {
      await auditLog(req.user.id, 'place_updated', `Updated place "${placeName}"`);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT name FROM places WHERE id=$1', [req.params.id]);
    await pool.query('DELETE FROM places WHERE id=$1', [req.params.id]);
    const placeName = existing.rows[0]?.name || `#${req.params.id}`;
    await auditLog(req.user.id, 'place_deleted', `Deleted place "${placeName}"`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  const { vote } = req.body;
  if (![1, -1].includes(vote)) return res.status(400).json({ error: 'vote must be 1 or -1' });
  try {
    await pool.query(
      `INSERT INTO votes (place_id, user_id, vote) VALUES ($1,$2,$3)
       ON CONFLICT (place_id, user_id) DO UPDATE SET vote = $3`,
      [req.params.id, req.user.id, vote]
    );
    const result = await pool.query('SELECT COALESCE(SUM(vote),0) AS score FROM votes WHERE place_id=$1', [req.params.id]);
    res.json({ score: parseInt(result.rows[0].score), my_vote: vote });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/vote', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM votes WHERE place_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    const result = await pool.query('SELECT COALESCE(SUM(vote),0) AS score FROM votes WHERE place_id=$1', [req.params.id]);
    res.json({ score: parseInt(result.rows[0].score), my_vote: null });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.display_name, u.avatar_color FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.place_id = $1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  try {
    const result = await pool.query(
      `INSERT INTO comments (place_id, user_id, content) VALUES ($1,$2,$3)
       RETURNING *, (SELECT display_name FROM users WHERE id=$2) AS display_name,
                   (SELECT avatar_color FROM users WHERE id=$2) AS avatar_color`,
      [req.params.id, req.user.id, content.trim()]
    );
    const place = await pool.query('SELECT name FROM places WHERE id=$1', [req.params.id]);
    await auditLog(req.user.id, 'comment_added', `Commented on "${place.rows[0]?.name || `#${req.params.id}`}"`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
