const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar_color VARCHAR(7) DEFAULT '#C0392B',
        must_change_password BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        country VARCHAR(100) DEFAULT 'Japan',
        lat DECIMAL(9,6),
        lng DECIMAL(9,6),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS places (
        id SERIAL PRIMARY KEY,
        city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL CHECK (category IN ('accommodation','food','attraction','transport','other')),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        address TEXT,
        lat DECIMAL(9,6),
        lng DECIMAL(9,6),
        price_range VARCHAR(20),
        url TEXT,
        image_url TEXT,
        status VARCHAR(20) DEFAULT 'considering' CHECK (status IN ('considering','shortlisted','booked','rejected')),
        added_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(place_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trip_days (
        id SERIAL PRIMARY KEY,
        city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        label VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS itinerary_items (
        id SERIAL PRIMARY KEY,
        day_id INTEGER REFERENCES trip_days(id) ON DELETE CASCADE,
        place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        custom_title VARCHAR(200),
        custom_description TEXT,
        start_time TIME,
        end_time TIME,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO cities (name, lat, lng, order_index)
      VALUES
        ('Osaka', 34.6937, 135.5023, 1),
        ('Kyoto', 35.0116, 135.7681, 2),
        ('Tokyo', 35.6762, 139.6503, 3)
      ON CONFLICT DO NOTHING;
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE`);
    console.log('Database initialised');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
