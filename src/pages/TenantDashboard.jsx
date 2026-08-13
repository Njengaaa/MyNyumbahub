import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function TenantDashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, created_at, listings ( id, title, area, city, rent_amount )')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setBookings(data || []);
      setLoading(false);
    }
    if (user) loadBookings();
  }, [user]);

  return (
    <div className="dashboard container">
      <div className="dashboard-header dashboard-header-tenant">
        <div>
          <span className="badge badge-tenant">Tenant</span>
          <h1>Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
          <p>Track your booking requests and discover new homes.</p>
        </div>
        <Link to="/listings" className="btn btn-accent">
          Browse listings
        </Link>
      </div>

      <section className="dashboard-section">
        <h2>My Booking Requests</h2>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            No booking requests yet. <Link to="/listings">Browse listings</Link> to get started.
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((b) => (
              <div key={b.id} className="booking-row">
                <div>
                  <p className="booking-row-title">{b.listings?.title}</p>
                  <p className="booking-row-sub">
                    {b.listings?.area}, {b.listings?.city} · KES{' '}
                    {b.listings?.rent_amount?.toLocaleString()}/mo
                  </p>
                </div>
                <span className={`status-pill status-${b.status}`}>{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default TenantDashboard;
