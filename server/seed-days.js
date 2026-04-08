#!/usr/bin/env node
// Run with: node seed-days.js
// Requires DATABASE_URL in environment (copy from your .env or set inline)

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seed() {
  const start = new Date('2026-11-20T12:00:00');
  const end   = new Date('2026-12-09T12:00:00');
  const inserted = [];
  const skipped  = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    const result = await pool.query(
      `INSERT INTO trip_days (date) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id, date`,
      [date]
    );
    if (result.rows.length) inserted.push(date);
    else skipped.push(date);
  }

  console.log(`Inserted ${inserted.length} days:`,  inserted.join(', ') || 'none');
  console.log(`Skipped  ${skipped.length} existing:`, skipped.join(', ')  || 'none');
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
