const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', requireAuth, async (req, res) => {
  if (req.user.id !== 1) return res.status(403).json({ error: 'Forbidden' });
  const { username, password, display_name, avatar_color } = req.body;
  if (!username || !password || !display_name) {
    return res.status(400).json({ error: 'username, password and display_name required' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, display_name, avatar_color, must_change_password)
       VALUES ($1, $2, $3, $4, TRUE) RETURNING id, username, display_name, avatar_color, must_change_password`,
      [username.toLowerCase(), hash, display_name, avatar_color || '#C0392B']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, username: user.username, display_name: user.display_name, avatar_color: user.avatar_color },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, display_name: user.display_name, avatar_color: user.avatar_color, must_change_password: user.must_change_password } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT id, username, display_name, avatar_color, must_change_password FROM users WHERE id = $1', [req.user.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, display_name, avatar_color FROM users ORDER BY display_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
