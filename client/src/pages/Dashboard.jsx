import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [forms, setForms] = useState({ place: { city: 'Casablanca', category: 'Restaurant' }, event: { city: 'Casablanca' } });

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'business') return navigate('/');
    axios.get('/api/host/reservations').then((res) => setReservations(res.data));
  }, [user]);

  const createPlace = async () => {
    const { data } = await axios.post('/api/places', forms.place);
    alert(`Place created: ${data.name}`);
  };

  const createEvent = async () => {
    const { data } = await axios.post('/api/events', forms.event);
    alert(`Event created: ${data.name}`);
  };

  const checkIn = async (id) => {
    const { data } = await axios.post(`/api/reservations/${id}/checkin`);
    setReservations(reservations.map((r) => (r.id === id ? data : r)));
  };

  return (
    <div className="stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Host</p>
          <h1>Business dashboard</h1>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Create place</h3>
          <input placeholder="Name" onChange={(e) => setForms({ ...forms, place: { ...forms.place, name: e.target.value } })} />
          <input placeholder="Category" value={forms.place.category} onChange={(e) => setForms({ ...forms, place: { ...forms.place, category: e.target.value } })} />
          <input placeholder="City" value={forms.place.city} onChange={(e) => setForms({ ...forms, place: { ...forms.place, city: e.target.value } })} />
          <textarea placeholder="Description" onChange={(e) => setForms({ ...forms, place: { ...forms.place, description: e.target.value } })}></textarea>
          <button className="btn" onClick={createPlace}>Save place</button>
        </div>
        <div className="card">
          <h3>Create event</h3>
          <input placeholder="Name" onChange={(e) => setForms({ ...forms, event: { ...forms.event, name: e.target.value } })} />
          <input placeholder="City" value={forms.event.city} onChange={(e) => setForms({ ...forms, event: { ...forms.event, city: e.target.value } })} />
          <input placeholder="Date" type="date" onChange={(e) => setForms({ ...forms, event: { ...forms.event, date: e.target.value } })} />
          <input placeholder="Time" type="time" onChange={(e) => setForms({ ...forms, event: { ...forms.event, time: e.target.value } })} />
          <textarea placeholder="Description" onChange={(e) => setForms({ ...forms, event: { ...forms.event, description: e.target.value } })}></textarea>
          <button className="btn" onClick={createEvent}>Save event</button>
        </div>
      </div>

      <div className="card">
        <h3>Reservations</h3>
        <div className="stack">
          {reservations.map((r) => (
            <div key={r.id} className="tile">
              <div>
                {r.related_type} • {r.date} {r.time} — {r.people_count} people
                <div className="muted">Code {r.reservation_code}</div>
              </div>
              <div className="row">
                <span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span>
                {r.status !== 'CHECKED_IN' && <button className="ghost" onClick={() => checkIn(r.id)}>Check-in</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
