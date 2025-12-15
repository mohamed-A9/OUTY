import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../components/AuthContext.jsx';

export default function PlaceDetail() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [reservation, setReservation] = useState({ people_count: 2, date: '', time: '' });
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { axios.get(`/api/places/${id}`).then((res) => setPlace(res.data)); }, [id]);

  const submitReservation = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await axios.post('/api/reservations', { ...reservation, related_type: 'place', related_id: id });
      navigate('/confirm', { state: data });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reservation failed');
    }
  };

  const leaveReview = async (rating) => {
    if (!user) return navigate('/login');
    await axios.post('/api/reviews', { related_type: 'place', related_id: id, rating });
    const refreshed = await axios.get(`/api/places/${id}`);
    setPlace(refreshed.data);
  };

  if (!place) return <p>Loading...</p>;

  return (
    <div className="stack">
      <div className="card">
        <p className="eyebrow">{place.city} • {place.category}</p>
        <h1>{place.name}</h1>
        <p className="muted">{place.vibe_tags?.join(', ')}</p>
        <p>{place.description}</p>
        <div className="chips">
          {place.rules && <span className="chip">Rules: {place.rules}</span>}
          {place.menu_pdf_url && <a className="chip" href={place.menu_pdf_url} target="_blank" rel="noreferrer">Menu PDF</a>}
        </div>
        <div className="stack">
          <h3>Location</h3>
          <p>{place.address}</p>
          <p>Phone: <a href={`tel:${place.phone}`}>{place.phone}</a> • WhatsApp: <a href={`https://wa.me/${place.whatsapp}`}>{place.whatsapp}</a></p>
        </div>
      </div>

      {place.reservation_mode !== 'NONE' && (
        <div className="card">
          <h3>Reservation</h3>
          {message && <div className="alert">{message}</div>}
          {place.reservation_mode === 'LINK' && place.reservation_link && (
            <a className="btn" href={place.reservation_link} target="_blank" rel="noreferrer">Book on partner</a>
          )}
          {place.reservation_mode === 'PHONE' && (
            <p>Call or WhatsApp the host to reserve.</p>
          )}
          {place.reservation_mode === 'OUTY' && (
            <div className="form-grid">
              <input placeholder="Full name" value={reservation.full_name || ''} onChange={(e) => setReservation({ ...reservation, full_name: e.target.value })} />
              <input placeholder="Email" value={reservation.email || ''} onChange={(e) => setReservation({ ...reservation, email: e.target.value })} />
              <input placeholder="Phone" value={reservation.phone || ''} onChange={(e) => setReservation({ ...reservation, phone: e.target.value })} />
              <input type="date" value={reservation.date} onChange={(e) => setReservation({ ...reservation, date: e.target.value })} />
              <input type="time" value={reservation.time} onChange={(e) => setReservation({ ...reservation, time: e.target.value })} />
              <input type="number" min="1" value={reservation.people_count} onChange={(e) => setReservation({ ...reservation, people_count: e.target.value })} />
              <textarea placeholder="Notes" value={reservation.note || ''} onChange={(e) => setReservation({ ...reservation, note: e.target.value })} />
              <button className="btn" onClick={submitReservation}>Reserve</button>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3>Reviews</h3>
        <div className="row">
          {[1,2,3,4,5].map((n) => <button key={n} className="ghost" onClick={() => leaveReview(n)}>{'★'.repeat(n)}</button>)}
        </div>
        <div className="stack">
          {place.reviews?.map((r) => (
            <div key={r.id} className="tile">
              <strong>{r.rating}★</strong> {r.comment}
              {r.reply && <p className="muted">Reply: {r.reply}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
