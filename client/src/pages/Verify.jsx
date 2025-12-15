import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function Verify() {
  const { code } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios.get(`/api/reservations/verify/${code}`).then((res) => setResult(res.data)).catch(() => setResult({ status: 'NOT_FOUND' }));
  }, [code]);

  if (!result) return <p>Checking...</p>;

  const statusClass = result.status === 'CHECKED_IN' ? 'success' : result.status === 'PENDING' ? 'pending' : 'muted';

  return (
    <div className="stack narrow">
      <div className="card">
        <p className="eyebrow">Reservation</p>
        <h1>{code}</h1>
        <div className={`badge ${statusClass}`}>{result.status}</div>
        {result.status === 'NOT_FOUND' && <p>Reservation not found.</p>}
        {result.status !== 'NOT_FOUND' && (
          <>
            <p>{result.related_type} • {result.date} {result.time}</p>
            <p>Guests: {result.people_count}</p>
          </>
        )}
      </div>
    </div>
  );
}
