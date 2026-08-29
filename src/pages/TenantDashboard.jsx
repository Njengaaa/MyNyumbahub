import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function TenantDashboard() {
  const { user, profile } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInquiries() {
      const { data, error } = await supabase
        .from('inquiries')
        .select('id, message, status, created_at, listings ( id, title, area, city, listing_type, rent_amount, sale_price )')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setInquiries(data || []);
      setLoading(false);
    }
    if (user) loadInquiries();
  }, [user]);

  return (
    <div className="dashboard container">
      <div className="dashboard-header dashboard-header-tenant">
        <div>
          <span className="badge badge-tenant">Tenant</span>
          <h1>Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
          <p>Track the listings you&rsquo;ve reached out about and discover new homes.</p>
        </div>
        <Link to="/listings" className="btn btn-accent">
          Browse listings
        </Link>
      </div>

      <section className="dashboard-section">
        <h2>My Inquiries</h2>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : inquiries.length === 0 ? (
          <div className="empty-state">
            No inquiries yet. <Link to="/listings">Browse listings</Link> and contact a landlord to get started.
          </div>
        ) : (
          <div className="booking-list">
            {inquiries.map((inq) => {
              const listing = inq.listings;
              const price =
                listing?.listing_type === 'sale'
                  ? `KES ${listing?.sale_price?.toLocaleString()}`
                  : `KES ${listing?.rent_amount?.toLocaleString()}/mo`;
              return (
                <div key={inq.id} className="booking-row">
                  <div>
                    <p className="booking-row-title">{listing?.title}</p>
                    <p className="booking-row-sub">
                      {listing?.area}, {listing?.city} · {price}
                    </p>
                  </div>
                  <span className={`status-pill status-${inq.status}`}>{inq.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default TenantDashboard;