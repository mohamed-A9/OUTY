import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Places from './pages/Places.jsx';
import Events from './pages/Events.jsx';
import PlaceDetail from './pages/PlaceDetail.jsx';
import EventDetail from './pages/EventDetail.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyReservations from './pages/MyReservations.jsx';
import Verify from './pages/Verify.jsx';
import { AuthProvider, useAuth } from './components/AuthContext.jsx';
import ReservationConfirmation from './pages/ReservationConfirmation.jsx';

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="nav">
      <Link to="/" className="brand">OUTY</Link>
      <nav>
        <Link to="/places">Places</Link>
        <Link to="/events">Events</Link>
        {user && <Link to="/reservations">My Reservations</Link>}
        {user?.role === 'business' && <Link to="/dashboard">Host</Link>}
      </nav>
      <div className="nav-actions">
        {user ? (
          <>
            <span className="pill">{user.email}</span>
            <button className="ghost" onClick={() => { logout(); navigate('/'); }}>Logout</button>
          </>
        ) : (
          <Link className="btn" to="/login">Login / Register</Link>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/places" element={<Places />} />
          <Route path="/events" element={<Events />} />
          <Route path="/places/:id" element={<PlaceDetail />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reservations" element={<MyReservations />} />
          <Route path="/verify/:code" element={<Verify />} />
          <Route path="/confirm" element={<ReservationConfirmation />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}
