import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{event.city} • {event.date}</p>
          <h3>{event.name}</h3>
          <p className="muted">{event.vibe_tags?.join(', ')}</p>
        </div>
        <div className="badge">⭐ {Number(event.rating || 0).toFixed(1)}</div>
      </div>
      <p>{event.description}</p>
      <div className="card-actions">
        <Link className="btn" to={`/events/${event.id}`}>Details</Link>
      </div>
    </div>
  );
}
