import { useEffect, useState } from 'react';
import axios from 'axios';
import Filters from '../components/Filters.jsx';
import PlaceCard from '../components/PlaceCard.jsx';

export default function Places() {
  const [places, setPlaces] = useState([]);
  const [config, setConfig] = useState({ cities: [], vibes: [] });
  const [filters, setFilters] = useState({});

  useEffect(() => { axios.get('/api/config').then((res) => setConfig(res.data)); }, []);
  useEffect(() => { axios.get('/api/places', { params: filters }).then((res) => setPlaces(res.data)); }, [filters]);

  return (
    <div className="stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Premium picks</p>
          <h1>Places</h1>
        </div>
      </div>
      <Filters cities={config.cities || []} vibes={config.vibes || []} filters={filters} onChange={setFilters} />
      <div className="grid">
        {places.map((p) => <PlaceCard key={p.id} place={p} />)}
      </div>
    </div>
  );
}
