import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-logo">
            Nyumba<span>hub</span>
          </p>
          <p className="footer-tagline">Verified homes across Nairobi &amp; Kiambu.</p>
        </div>

        <div className="footer-col">
          <p className="footer-heading">Explore</p>
          <Link to="/listings">Listings</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Register</Link>
        </div>

        <div className="footer-col">
          <p className="footer-heading">Trust</p>
          <span>Verified listings</span>
          <span>Role-based accounts</span>
          <span>Secure Supabase auth</span>
        </div>
      </div>

      <div className="footer-bottom container">© {new Date().getFullYear()} Nyumbahub</div>
    </footer>
  );
}

export default Footer;
