import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function LandlordDashboard() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: myListings } = await supabase
        .from('listings')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      setListings(myListings || []);

      const { data: myBookings } = await supabase
        .from('bookings')
        .select('id, status, created_at, listings ( id, title ), profiles ( full_name )')
        .order('created_at', { ascending: false });

      setBookings(myBookings || []);
      setLoading(false);
    }
    if (user) loadData();
  }, [user]);

  const handleDelete = async (listingId) => {
    if (!window.confirm('Delete this listing?')) return;
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (!error) setListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  const updateBookingStatus = async (bookingId, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
    if (!error) {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    }
  };

  return (
    <div className="dashboard container">
      <div className="dashboard-header dashboard-header-landlord">
        <div>
          <span className="badge badge-landlord">Landlord</span>
          <h1>Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
          <p>Manage your listings and respond to booking requests.</p>
        </div>
        <Link to="/dashboard/landlord/new" className="btn btn-gold">
          + Add listing
        </Link>
      </div>

      <section className="dashboard-section">
        <h2>My Listings</h2>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            You haven&rsquo;t added any listings yet.{' '}
            <Link to="/dashboard/landlord/new">Add your first one</Link>.
          </div>
        ) : (
          <div className="landlord-listing-list">
            {listings.map((l) => (
              <div key={l.id} className="landlord-listing-row">
                <div>
                  <p className="booking-row-title">{l.title}</p>
                  <p className="booking-row-sub">
                    {l.area}, {l.city} · KES {l.rent_amount.toLocaleString()}/mo
                  </p>
                </div>
                <div className="landlord-listing-actions">
                  <Link to={`/listings/${l.id}`} className="btn btn-outline">
                    View
                  </Link>
                  <button type="button" className="btn btn-outline danger" onClick={() => handleDelete(l.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Booking Requests</h2>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">No booking requests yet.</div>
        ) : (
          <div className="booking-list">
            {bookings.map((b) => (
              <div key={b.id} className="booking-row">
                <div>
                  <p className="booking-row-title">{b.listings?.title}</p>
                  <p className="booking-row-sub">Requested by {b.profiles?.full_name || 'a tenant'}</p>
                </div>
                {b.status === 'pending' ? (
                  <div className="booking-row-actions">
                    <button
                      type="button"
                      className="btn btn-accent btn-sm"
                      onClick={() => updateBookingStatus(b.id, 'confirmed')}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => updateBookingStatus(b.id, 'cancelled')}
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <span className={`status-pill status-${b.status}`}>{b.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default LandlordDashboard;
