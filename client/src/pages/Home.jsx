import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Filters from '../components/Filters.jsx';
import PlaceCard from '../components/PlaceCard.jsx';
import EventCard from '../components/EventCard.jsx';
import { API } from '../components/AuthContext.jsx';

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [config, setConfig] = useState({ cities: [], vibes: [] });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    axios.get('/api/config').then((res) => setConfig(res.data));
  }, []);

  useEffect(() => {
    axios.get('/api/places', { params: filters }).then((res) => setPlaces(res.data));
    axios.get('/api/events', { params: filters }).then((res) => setEvents(res.data));
  }, [filters]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setFilters({ ...filters, nearLat: pos.coords.latitude, nearLng: pos.coords.longitude });
    });
  };

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Morocco • Nightlife & Business</p>
          <h1>Discover where to go out today with OUTY</h1>
          <p className="muted">Premium destinations, curated vibes, fast booking. Built for Casablanca, Rabat, Marrakech and more.</p>
          <div className="row">
            <Link className="btn" to="/places">Explore Places</Link>
            <Link className="ghost" to="/events">Upcoming Events</Link>
            <button className="ghost" onClick={detectLocation}>Near me</button>
          </div>
        </div>
        <div className="card gradient">
          <h3>Morocco Cities</h3>
          <div className="chips">
            {config.cities?.map((c) => <span key={c} className="chip">{c}</span>)}
          </div>
        </div>
      </section>

      <Filters cities={config.cities || []} vibes={config.vibes || []} filters={filters} onChange={setFilters} />

      <section>
        <div className="section-header">
          <h2>Featured Places</h2>
          <Link to="/places">See all</Link>
        </div>
        <div className="grid">
          {places.slice(0, 3).map((p) => <PlaceCard key={p.id} place={p} />)}
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>This Week</h2>
          <Link to="/events">See events</Link>
        </div>
        <div className="grid">
          {events.slice(0, 2).map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>
    </div>
  );
}
