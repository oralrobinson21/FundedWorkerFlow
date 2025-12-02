const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        phone TEXT,
        default_zip_code TEXT,
        stripe_account_id TEXT,
        stripe_customer_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        area_description TEXT,
        full_address TEXT,
        price DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'requested',
        poster_id TEXT REFERENCES users(id),
        poster_name TEXT,
        poster_email TEXT,
        helper_id TEXT REFERENCES users(id),
        helper_name TEXT,
        confirmation_code TEXT,
        photos_required BOOLEAN DEFAULT FALSE,
        stripe_checkout_session_id TEXT,
        stripe_payment_intent_id TEXT,
        stripe_charge_id TEXT,
        platform_fee_amount INTEGER,
        helper_amount INTEGER,
        payment_status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        completed_at TIMESTAMP,
        canceled_at TIMESTAMP,
        canceled_by TEXT
      );

      CREATE TABLE IF NOT EXISTS offers (
        id TEXT PRIMARY KEY,
        task_id TEXT REFERENCES tasks(id),
        helper_id TEXT REFERENCES users(id),
        helper_name TEXT,
        note TEXT,
        proposed_price DECIMAL(10,2),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_threads (
        id TEXT PRIMARY KEY,
        task_id TEXT REFERENCES tasks(id),
        poster_id TEXT REFERENCES users(id),
        helper_id TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        is_closed BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        thread_id TEXT REFERENCES chat_threads(id),
        sender_id TEXT REFERENCES users(id),
        sender_name TEXT,
        text TEXT,
        image_url TEXT,
        is_proof BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
