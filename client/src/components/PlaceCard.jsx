import { Link } from 'react-router-dom';

export default function PlaceCard({ place }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{place.category} • {place.city}</p>
          <h3>{place.name}</h3>
          <p className="muted">{place.vibe_tags?.join(', ')}</p>
        </div>
        <div className="badge">⭐ {Number(place.rating || 0).toFixed(1)}</div>
      </div>
      <p>{place.description}</p>
      <div className="card-actions">
        <Link className="btn" to={`/places/${place.id}`}>View</Link>
      </div>
    </div>
  );
}
