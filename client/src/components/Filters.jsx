export default function Filters({ cities, vibes, filters, onChange }) {
  return (
    <div className="card filters">
      <div className="filter-row">
        <label>City</label>
        <select value={filters.city || ''} onChange={(e) => onChange({ ...filters, city: e.target.value || null })}>
          <option value="">All</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="filter-row">
        <label>Vibe</label>
        <select value={filters.vibe || ''} onChange={(e) => onChange({ ...filters, vibe: e.target.value || null })}>
          <option value="">Any</option>
          {vibes.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
    </div>
  );
}
