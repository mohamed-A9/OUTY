import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('Database connection error', err));

export const query = (text, params) => pool.query(text, params);

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        business_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS places (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id),
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        city TEXT NOT NULL,
        vibe_tags TEXT[],
        description TEXT,
        address TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        phone TEXT,
        whatsapp TEXT,
        rules TEXT,
        menu_pdf_url TEXT,
        reservation_mode TEXT NOT NULL DEFAULT 'NONE',
        reservation_link TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id),
        place_id UUID REFERENCES places(id),
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        vibe_tags TEXT[],
        date DATE,
        time TEXT,
        description TEXT,
        address TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        rules TEXT,
        ticket_link TEXT,
        reservation_mode TEXT NOT NULL DEFAULT 'NONE',
        reservation_link TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id),
        related_type TEXT,
        related_id UUID,
        type TEXT,
        url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        related_type TEXT NOT NULL,
        related_id UUID NOT NULL,
        user_id UUID REFERENCES users(id),
        host_owner_id UUID REFERENCES users(id),
        full_name TEXT,
        email TEXT,
        phone TEXT,
        date DATE,
        time TEXT,
        people_count INTEGER,
        note TEXT,
        reservation_code TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        related_type TEXT NOT NULL,
        related_id UUID NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        reply TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, related_type, related_id)
      );
    `);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating tables', err);
    throw err;
  } finally {
    client.release();
  }
}

export async function seedData() {
  const cities = ['Casablanca','Rabat','Marrakech','Tangier','Agadir','Fes','Meknes','Oujda','Tetouan','Nador'];
  const seedHash = process.env.DEFAULT_SEED_PASSWORD_HASH || '20b1f4cfd30ec0c8a8b8b84bd6723106:bfdf987df8348e135d798bada29de344060fa0aa8f8d6aa0044477b30691aa95d15e79e480c7f9cd9a8f11c80e9efdc62e30e81889648e7827cd8062bd4d8f7a';
  await query(`INSERT INTO users (email, password_hash, role, business_name)
    VALUES ($1, $2, 'business', 'Atlas Hospitality')
    ON CONFLICT (email) DO NOTHING`, ['host@outy.ma', seedHash]);
  await query(`INSERT INTO users (email, password_hash, role)
    VALUES ($1, $2, 'user')
    ON CONFLICT (email) DO NOTHING`, ['user@outy.ma', seedHash]);

  const { rows } = await query('SELECT id FROM users WHERE email=$1', ['host@outy.ma']);
  const hostId = rows[0]?.id;

  const placeCount = await query('SELECT COUNT(*) FROM places');
  if (Number(placeCount.rows[0].count) === 0 && hostId) {
    await query(`
      INSERT INTO places (owner_id, name, category, city, vibe_tags, description, address, phone, whatsapp, rules, menu_pdf_url, reservation_mode)
      VALUES
      ($1,'Skyline Rooftop','Restaurant','Casablanca',ARRAY['Rooftop','Luxury'], 'Modern rooftop dining with panoramic views.', 'Boulevard d\'Anfa, Casablanca', '+212600000001', '+212600000001', 'Smart casual. 21+ after 8pm.', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf','OUTY'),
      ($1,'Medina Beats','Club','Marrakech',ARRAY['Party','Live Music'], 'High-energy club with Moroccan DJs.', 'Medina, Marrakech', '+212600000002', '+212600000002', 'Valid ID required.', null,'PHONE'),
      ($1,'Business Hub Cafe','Business','Rabat',ARRAY['Business','Networking'], 'Calm cafe ideal for networking meetups.', 'Avenue Mohammed VI, Rabat', '+212600000003', '+212600000003', 'Respect quiet hours.', null,'LINK')
    `, [hostId]);
  }

  const eventCount = await query('SELECT COUNT(*) FROM events');
  if (Number(eventCount.rows[0].count) === 0 && hostId) {
    await query(`
      INSERT INTO events (owner_id, name, city, vibe_tags, date, time, description, address, rules, ticket_link, reservation_mode)
      VALUES
      ($1,'Casablanca Tech Mixer','Casablanca',ARRAY['Networking','Conference'], CURRENT_DATE + INTERVAL '7 days', '19:00', 'Tech leaders meet-up with lightning talks.', 'Tech Park, Casablanca', 'Bring business cards.', 'https://tickets.outy.ma/tech', 'OUTY'),
      ($1,'Marrakech Sunset Sessions','Marrakech',ARRAY['Chill','Live Music'], CURRENT_DATE + INTERVAL '3 days', '18:00', 'Live music at sunset on the terrace.', 'Guéliz, Marrakech', 'First come first served seating.', null, 'PHONE')
    `, [hostId]);
  }

  const placeId = (await query('SELECT id FROM places LIMIT 1')).rows[0]?.id;
  const userId = (await query('SELECT id FROM users WHERE email=$1', ['user@outy.ma'])).rows[0]?.id;
  if (placeId && userId) {
    await query(`INSERT INTO reviews (user_id, related_type, related_id, rating, comment)
      VALUES ($1,'place',$2,5,'Fantastic spot with great service!')
      ON CONFLICT DO NOTHING`, [userId, placeId]);
  }
}
