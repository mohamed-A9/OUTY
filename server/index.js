import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { query, initDb, seedData } from './db.js';
import { hashPassword, verifyPassword, signToken, authenticate } from './auth.js';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const MOROCCO_CITIES = ['Casablanca','Rabat','Marrakech','Tangier','Agadir','Fes','Meknes','Oujda','Tetouan','Nador'];
const VIBES = ['Chill','Luxury','Party','Live Music','Rooftop','Business','Networking','Conference'];

function reservationCode() {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `OUTY-${random}`;
}

function pickReservationTarget(body) {
  const { related_type, related_id } = body;
  if (!['place', 'event'].includes(related_type)) throw new Error('Invalid related type');
  return { related_type, related_id };
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role = 'user', business_name } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(400).json({ message: 'Email already in use' });
    const password_hash = hashPassword(password);
    const result = await query(
      'INSERT INTO users (email, password_hash, role, business_name) VALUES ($1,$2,$3,$4) RETURNING id, email, role, business_name',
      [email, password_hash, role, business_name || null]
    );
    const token = signToken(result.rows[0]);
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to register' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const result = await query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, business_name: user.business_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/config', (req, res) => {
  res.json({ cities: MOROCCO_CITIES, vibes: VIBES, clientUrl: CLIENT_URL });
});

app.get('/api/places', async (req, res) => {
  const { city, category, vibe, nearLat, nearLng } = req.query;
  try {
    let filters = [];
    let values = [];
    if (city) {
      values.push(city);
      filters.push(`city=$${values.length}`);
    }
    if (category) {
      values.push(category);
      filters.push(`category=$${values.length}`);
    }
    if (vibe) {
      values.push(vibe);
      filters.push(`$${values.length}=ANY(vibe_tags)`);
    }
    const sql = `SELECT *, (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE related_type='place' AND related_id=places.id) as rating FROM places${filters.length ? ' WHERE ' + filters.join(' AND ') : ''} ORDER BY created_at DESC`;
    const result = await query(sql, values);
    const places = result.rows.map((p) => {
      if (nearLat && nearLng && p.latitude && p.longitude) {
        const dLat = Math.abs(p.latitude - Number(nearLat));
        const dLng = Math.abs(p.longitude - Number(nearLng));
        return { ...p, distance_hint: Math.sqrt(dLat ** 2 + dLng ** 2) };
      }
      return p;
    });
    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load places' });
  }
});

app.get('/api/places/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT *, (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE related_type='place' AND related_id=places.id) as rating
       FROM places WHERE id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    const media = await query('SELECT * FROM media WHERE related_type=$1 AND related_id=$2', ['place', req.params.id]);
    const reviews = await query('SELECT * FROM reviews WHERE related_type=$1 AND related_id=$2', ['place', req.params.id]);
    res.json({ ...result.rows[0], media: media.rows, reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load place' });
  }
});

app.get('/api/events', async (req, res) => {
  const { city, vibe } = req.query;
  try {
    let filters = [];
    let values = [];
    if (city) {
      values.push(city);
      filters.push(`city=$${values.length}`);
    }
    if (vibe) {
      values.push(vibe);
      filters.push(`$${values.length}=ANY(vibe_tags)`);
    }
    const sql = `SELECT *, (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE related_type='event' AND related_id=events.id) as rating FROM events${filters.length ? ' WHERE ' + filters.join(' AND ') : ''} ORDER BY date ASC`;
    const result = await query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load events' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT *, (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE related_type='event' AND related_id=events.id) as rating
       FROM events WHERE id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    const media = await query('SELECT * FROM media WHERE related_type=$1 AND related_id=$2', ['event', req.params.id]);
    const reviews = await query('SELECT * FROM reviews WHERE related_type=$1 AND related_id=$2', ['event', req.params.id]);
    res.json({ ...result.rows[0], media: media.rows, reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load event' });
  }
});

app.post('/api/places', authenticate, async (req, res) => {
  const { role } = req.user;
  if (role !== 'business') return res.status(403).json({ message: 'Business only' });
  const {
    name, category, city, vibe_tags = [], description, address, latitude, longitude, phone, whatsapp, rules, menu_pdf_url, reservation_mode = 'NONE', reservation_link,
  } = req.body;
  try {
    const result = await query(
      `INSERT INTO places (owner_id, name, category, city, vibe_tags, description, address, latitude, longitude, phone, whatsapp, rules, menu_pdf_url, reservation_mode, reservation_link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [req.user.id, name, category, city, vibe_tags, description, address, latitude, longitude, phone, whatsapp, rules, menu_pdf_url, reservation_mode, reservation_link]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create place' });
  }
});

app.post('/api/events', authenticate, async (req, res) => {
  if (req.user.role !== 'business') return res.status(403).json({ message: 'Business only' });
  const { name, city, vibe_tags = [], date, time, description, address, latitude, longitude, rules, ticket_link, reservation_mode = 'NONE', reservation_link, place_id } = req.body;
  try {
    const result = await query(
      `INSERT INTO events (owner_id, place_id, name, city, vibe_tags, date, time, description, address, latitude, longitude, rules, ticket_link, reservation_mode, reservation_link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [req.user.id, place_id || null, name, city, vibe_tags, date, time, description, address, latitude, longitude, rules, ticket_link, reservation_mode, reservation_link]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

app.post('/api/reservations', authenticate, async (req, res) => {
  try {
    const { related_type, related_id } = pickReservationTarget(req.body);
    const { date, time, people_count, full_name, email, phone, note } = req.body;
    const targetTable = related_type === 'place' ? 'places' : 'events';
    const target = await query(`SELECT reservation_mode, reservation_link, owner_id FROM ${targetTable} WHERE id=$1`, [related_id]);
    if (!target.rows.length) return res.status(404).json({ message: 'Target not found' });
    if (target.rows[0].reservation_mode === 'NONE') return res.status(400).json({ message: 'Reservations disabled' });
    const reservation_code = reservationCode();
    const result = await query(
      `INSERT INTO reservations (related_type, related_id, user_id, host_owner_id, full_name, email, phone, date, time, people_count, note, reservation_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [related_type, related_id, req.user.id, target.rows[0].owner_id, full_name || null, email || null, phone || null, date, time, people_count, note || null, reservation_code]
    );
    const qr = await QRCode.toDataURL(`${CLIENT_URL}/verify/${reservation_code}`);
    res.json({ reservation: result.rows[0], qr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create reservation' });
  }
});

app.get('/api/reservations/verify/:code', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM reservations WHERE reservation_code=$1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ status: 'NOT_FOUND' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

app.get('/api/me/reservations', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM reservations WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load reservations' });
  }
});

app.get('/api/host/reservations', authenticate, async (req, res) => {
  if (req.user.role !== 'business') return res.status(403).json({ message: 'Business only' });
  try {
    const { rows } = await query('SELECT * FROM reservations WHERE host_owner_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load host reservations' });
  }
});

app.post('/api/reservations/:id/checkin', authenticate, async (req, res) => {
  if (req.user.role !== 'business') return res.status(403).json({ message: 'Business only' });
  try {
    const { rows } = await query('UPDATE reservations SET status=$1 WHERE id=$2 AND host_owner_id=$3 RETURNING *', ['CHECKED_IN', req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Reservation not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to check-in' });
  }
});

app.post('/api/reviews', authenticate, async (req, res) => {
  const { related_type, related_id, rating, comment } = req.body;
  try {
    await query(`INSERT INTO reviews (user_id, related_type, related_id, rating, comment)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (user_id, related_type, related_id) DO UPDATE SET rating=EXCLUDED.rating, comment=EXCLUDED.comment`, [req.user.id, related_type, related_id, rating, comment]);
    res.json({ message: 'Review saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save review' });
  }
});

app.post('/api/reviews/:id/reply', authenticate, async (req, res) => {
  if (req.user.role !== 'business') return res.status(403).json({ message: 'Business only' });
  const { reply } = req.body;
  try {
    const { rows } = await query('UPDATE reviews SET reply=$1 WHERE id=$2 RETURNING *', [reply, req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Review not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reply' });
  }
});

app.get('/api/media/:type/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM media WHERE related_type=$1 AND related_id=$2', [req.params.type, req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load media' });
  }
});

app.post('/api/media', authenticate, async (req, res) => {
  if (req.user.role !== 'business') return res.status(403).json({ message: 'Business only' });
  const { related_type, related_id, type, url } = req.body;
  try {
    const { rows } = await query('INSERT INTO media (owner_id, related_type, related_id, type, url) VALUES ($1,$2,$3,$4,$5) RETURNING *', [req.user.id, related_type, related_id, type, url]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save media' });
  }
});

async function start() {
  try {
    await initDb();
    await seedData();
    app.listen(PORT, () => console.log(`OUTY server running on ${PORT}`));
  } catch (err) {
    console.error('Server failed to start', err);
    process.exit(1);
  }
}

start();
