const express = require('express');
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.display_name AS added_by_name, u.avatar_color AS added_by_color
       FROM costs c
       LEFT JOIN users u ON c.added_by = u.id
       ORDER BY c.date ASC NULLS LAST, c.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { title, amount, currency, category, date, paid_by, notes } = req.body;
  if (!title || amount == null) return res.status(400).json({ error: 'title and amount required' });
  try {
    const result = await pool.query(
      `INSERT INTO costs (title, amount, currency, category, date, paid_by, notes, added_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, amount, currency || 'GBP', category || 'other', date || null, paid_by, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, amount, currency, category, date, paid_by, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE costs SET
        title=COALESCE($1,title),
        amount=COALESCE($2,amount),
        currency=COALESCE($3,currency),
        category=COALESCE($4,category),
        date=$5,
        paid_by=COALESCE($6,paid_by),
        notes=COALESCE($7,notes)
       WHERE id=$8 RETURNING *`,
      [title, amount, currency, category, date || null, paid_by, notes, req.params.id]
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
    await pool.query('DELETE FROM costs WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
