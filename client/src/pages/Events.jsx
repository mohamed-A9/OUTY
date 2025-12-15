import { useEffect, useState } from 'react';
import axios from 'axios';
import Filters from '../components/Filters.jsx';
import EventCard from '../components/EventCard.jsx';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [config, setConfig] = useState({ cities: [], vibes: [] });
  const [filters, setFilters] = useState({});

  useEffect(() => { axios.get('/api/config').then((res) => setConfig(res.data)); }, []);
  useEffect(() => { axios.get('/api/events', { params: filters }).then((res) => setEvents(res.data)); }, [filters]);

  return (
    <div className="stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">What's happening</p>
          <h1>Events</h1>
        </div>
      </div>
      <Filters cities={config.cities || []} vibes={config.vibes || []} filters={filters} onChange={setFilters} />
      <div className="grid">
        {events.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
    </div>
  );
}
