import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ListingsMap from '../components/ListingsMap';
import ListingCard from '../components/ListingCard';
import './Home.css';

function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setListings(data || []);
      setLoading(false);
    }
    loadListings();
  }, []);

  const featured = listings.slice(0, 3);

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">Verified homes, real accounts</span>
          <h1>Find your next home in Nairobi &amp; Kiambu.</h1>
          <p>
            Nyumbahub connects tenants with verified landlords directly — browse real
            locations on the map, create an account, and request a viewing in minutes.
          </p>
          <div className="hero-cta-row">
            <Link to="/listings" className="btn btn-accent">
              Browse listings
            </Link>
            <Link to="/register" className="btn btn-outline">
              Create an account
            </Link>
          </div>
        </div>
        <div className="hero-stat-grid">
          <div className="hero-stat-card">
            <span className="hero-stat-number">{listings.length}+</span>
            <span className="hero-stat-label">Live listings</span>
          </div>
          <div className="hero-stat-card hero-stat-card-gold">
            <span className="hero-stat-number">2</span>
            <span className="hero-stat-label">Account types</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-number">Nairobi + Kiambu</span>
            <span className="hero-stat-label">Coverage area</span>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Explore Nairobi &amp; Kiambu</h2>
          <p>Every pin is a real listing. Click one to see details.</p>
        </div>
        {loading ? (
          <div className="empty-state">Loading map…</div>
        ) : (
          <ListingsMap listings={listings} />
        )}
      </section>

      <section className="section-block how-it-works">
        <div className="section-heading">
          <h2>How it works</h2>
        </div>
        <div className="how-it-works-grid">
          <div className="how-it-works-card">
            <span className="how-it-works-num">1</span>
            <h3>Create an account</h3>
            <p>Sign up as a tenant to browse, or a landlord to list a property.</p>
          </div>
          <div className="how-it-works-card">
            <span className="how-it-works-num">2</span>
            <h3>Find or list a home</h3>
            <p>Tenants browse verified listings on the map. Landlords manage listings from their dashboard.</p>
          </div>
          <div className="how-it-works-card">
            <span className="how-it-works-num">3</span>
            <h3>Connect directly</h3>
            <p>Request a viewing and track the status right from your dashboard.</p>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Recently listed</h2>
          <Link to="/listings" className="section-heading-link">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="empty-state">Loading listings…</div>
        ) : featured.length === 0 ? (
          <div className="empty-state">No listings yet.</div>
        ) : (
          <div className="featured-grid">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
