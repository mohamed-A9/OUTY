import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../components/AuthContext.jsx';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [reservation, setReservation] = useState({ people_count: 2, date: '', time: '' });
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { axios.get(`/api/events/${id}`).then((res) => setEvent(res.data)); }, [id]);

  const submitReservation = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await axios.post('/api/reservations', { ...reservation, related_type: 'event', related_id: id });
      navigate('/confirm', { state: data });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reservation failed');
    }
  };

  if (!event) return <p>Loading...</p>;

  return (
    <div className="stack">
      <div className="card">
        <p className="eyebrow">{event.city} • {event.date}</p>
        <h1>{event.name}</h1>
        <p className="muted">{event.vibe_tags?.join(', ')}</p>
        <p>{event.description}</p>
        <div className="chips">
          {event.rules && <span className="chip">Rules: {event.rules}</span>}
          {event.ticket_link && <a className="chip" href={event.ticket_link} target="_blank" rel="noreferrer">Tickets</a>}
        </div>
      </div>

      {event.reservation_mode !== 'NONE' && (
        <div className="card">
          <h3>Reserve / RSVP</h3>
          {message && <div className="alert">{message}</div>}
          {event.reservation_mode === 'OUTY' && (
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
          {event.reservation_mode === 'LINK' && event.reservation_link && <a className="btn" href={event.reservation_link} target="_blank" rel="noreferrer">Book on partner</a>}
          {event.reservation_mode === 'PHONE' && <p>Contact the host via phone or WhatsApp.</p>}
        </div>
      )}
    </div>
  );
}
