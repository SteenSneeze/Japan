const express = require('express');
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.display_name AS added_by_name, u.avatar_color AS added_by_color
       FROM links l
       LEFT JOIN users u ON l.added_by = u.id
       ORDER BY l.category ASC, l.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { title, url, description, category } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title and url required' });
  try {
    const result = await pool.query(
      `INSERT INTO links (title, url, description, category, added_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, url, description, category || 'other', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, url, description, category } = req.body;
  try {
    const result = await pool.query(
      `UPDATE links SET
        title=COALESCE($1,title),
        url=COALESCE($2,url),
        description=COALESCE($3,description),
        category=COALESCE($4,category)
       WHERE id=$5 RETURNING *`,
      [title, url, description, category, req.params.id]
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
    await pool.query('DELETE FROM links WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
