import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function MyReservations() {
  const [items, setItems] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return navigate('/login');
    axios.get('/api/me/reservations').then((res) => setItems(res.data));
  }, [user]);

  return (
    <div className="stack">
      <div className="section-header">
        <h1>My reservations</h1>
      </div>
      <div className="stack">
        {items.map((r) => (
          <div key={r.id} className="tile">
            <strong>{r.related_type}</strong> • {r.date} {r.time} • {r.people_count} people
            <span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span>
            <div className="muted">Code: {r.reservation_code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
