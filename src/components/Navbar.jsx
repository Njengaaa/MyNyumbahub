import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardPath = profile?.role === 'landlord' ? '/dashboard/landlord' : '/dashboard/tenant';

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          Nyumba<span>hub</span>
        </Link>

        <nav className="navbar-links">
          <Link to="/listings">Listings</Link>

          {user ? (
            <>
              <Link to={dashboardPath}>Dashboard</Link>
              {profile?.role && (
                <span className={`badge badge-${profile.role}`}>{profile.role}</span>
              )}
              <button type="button" className="navbar-logout" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register" className="btn btn-accent navbar-cta">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
