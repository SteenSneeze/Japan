const express = require('express');
const { pool, auditLog } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.display_name AS added_by_name, u.avatar_color AS added_by_color,
        COALESCE(json_agg(cp.user_id) FILTER (WHERE cp.user_id IS NOT NULL), '[]') AS paid_user_ids
       FROM costs c
       LEFT JOIN users u ON c.added_by = u.id
       LEFT JOIN cost_payments cp ON cp.cost_id = c.id
       GROUP BY c.id, u.display_name, u.avatar_color
       ORDER BY c.date ASC NULLS LAST, c.created_at ASC`
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
      'SELECT id FROM cost_payments WHERE cost_id=$1 AND user_id=$2', [id, userId]
    );
    if (existing.rows.length) {
      await pool.query('DELETE FROM cost_payments WHERE cost_id=$1 AND user_id=$2', [id, userId]);
    } else {
      await pool.query('INSERT INTO cost_payments (cost_id, user_id) VALUES ($1, $2)', [id, userId]);
    }
    const result = await pool.query(
      `SELECT COALESCE(json_agg(user_id), '[]') AS paid_user_ids FROM cost_payments WHERE cost_id=$1`, [id]
    );
    res.json({ paid_user_ids: result.rows[0].paid_user_ids });
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
    await auditLog(req.user.id, 'cost_added', `Added cost: "${title}" — A$${parseFloat(amount).toFixed(2)} (${category || 'other'})`);
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
    await auditLog(req.user.id, 'cost_updated', `Updated cost: "${result.rows[0].title}" — A$${parseFloat(result.rows[0].amount).toFixed(2)}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT title, amount FROM costs WHERE id=$1', [req.params.id]);
    await pool.query('DELETE FROM costs WHERE id=$1', [req.params.id]);
    const c = existing.rows[0];
    await auditLog(req.user.id, 'cost_deleted', `Deleted cost: "${c?.title}" — A$${parseFloat(c?.amount || 0).toFixed(2)}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
