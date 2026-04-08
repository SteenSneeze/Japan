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

      CREATE TABLE IF NOT EXISTS flights (
        id SERIAL PRIMARY KEY,
        airline VARCHAR(100),
        flight_number VARCHAR(20),
        from_location VARCHAR(200) NOT NULL,
        to_location VARCHAR(200) NOT NULL,
        departure_datetime TIMESTAMPTZ,
        arrival_datetime TIMESTAMPTZ,
        booking_reference VARCHAR(100),
        price VARCHAR(50),
        notes TEXT,
        added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accommodations (
        id SERIAL PRIMARY KEY,
        city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
        name VARCHAR(200) NOT NULL,
        address TEXT,
        check_in DATE,
        check_out DATE,
        booking_reference VARCHAR(100),
        price_per_night VARCHAR(50),
        total_price VARCHAR(50),
        url TEXT,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'considering' CHECK (status IN ('considering','booked','cancelled')),
        added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('safety','visa','travel-info','emergency','booking','other')),
        added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS costs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'AUD',
        category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('flights','accommodation','food','activities','transport','shopping','other')),
        date DATE,
        paid_by VARCHAR(100),
        notes TEXT,
        added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cost_payments (
        id SERIAL PRIMARY KEY,
        cost_id INTEGER REFERENCES costs(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(cost_id, user_id)
      );

      INSERT INTO cities (name, lat, lng, order_index)
      SELECT * FROM (VALUES
        ('Osaka', 34.6937::DECIMAL, 135.5023::DECIMAL, 1),
        ('Kyoto', 35.0116::DECIMAL, 135.7681::DECIMAL, 2),
        ('Tokyo', 35.6762::DECIMAL, 139.6503::DECIMAL, 3)
      ) AS v(name, lat, lng, order_index)
      WHERE NOT EXISTS (SELECT 1 FROM cities);
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`);
    await client.query(`UPDATE users SET username = LOWER(username)`);
    await client.query(`ALTER TABLE costs DROP CONSTRAINT IF EXISTS costs_category_check`);
    await client.query(`ALTER TABLE costs ADD CONSTRAINT costs_category_check CHECK (category IN ('flights','accommodation','food','activities','transport','shopping','travel_insurance','esim','other'))`);
    await client.query(`UPDATE users SET is_admin = TRUE WHERE username = 'barney'`);
    console.log('Database initialised');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
