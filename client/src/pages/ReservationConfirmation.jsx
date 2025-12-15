import { useLocation, Link } from 'react-router-dom';

export default function ReservationConfirmation() {
  const { state } = useLocation();
  if (!state) return <p>No reservation found.</p>;
  const { reservation, qr } = state;
  return (
    <div className="stack narrow">
      <div className="card">
        <p className="eyebrow">Reservation confirmed</p>
        <h1>{reservation.reservation_code}</h1>
        <img src={qr} alt="QR" className="qr" />
        <p>{reservation.related_type} • {reservation.date} {reservation.time}</p>
        <p>{reservation.people_count} guests</p>
        <Link className="btn" to={`/verify/${reservation.reservation_code}`}>Open verification page</Link>
      </div>
    </div>
  );
}
