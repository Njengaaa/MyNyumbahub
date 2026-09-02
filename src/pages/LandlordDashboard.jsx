import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function LandlordDashboard() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: myListings } = await supabase
        .from('listings')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      setListings(myListings || []);

      const { data: myInquiries } = await supabase
        .from('inquiries')
        .select('id, message, status, created_at, listings ( id, title, landlord_id ), profiles ( full_name )')
        .order('created_at', { ascending: false });

      // RLS ("Landlords can view inquiries on their listings") already scopes
      // this to the current landlord's own listings, so no client-side filter needed.
      setInquiries(myInquiries || []);
      setLoading(false);
    }
    if (user) loadData();
  }, [user]);

  const handleDelete = async (listingId) => {
    if (!window.confirm('Delete this listing?')) return;
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (!error) setListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  const updateInquiryStatus = async (inquiryId, status) => {
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', inquiryId);
    if (!error) {
      setInquiries((prev) => prev.map((i) => (i.id === inquiryId ? { ...i, status } : i)));
    }
  };

  return (
    <div className="dashboard container">
      <div className="dashboard-header dashboard-header-landlord">
        <div>
          <span className="badge badge-landlord">Landlord</span>
          <h1>Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
          <p>Manage your listings and respond to inquiries.</p>
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
                    {l.area}, {l.city} ·{' '}
                    {l.listing_type === 'sale'
                      ? `KES ${l.sale_price?.toLocaleString()}`
                      : `KES ${l.rent_amount?.toLocaleString()}/mo`}
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
        <h2>Inquiries Received</h2>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : inquiries.length === 0 ? (
          <div className="empty-state">No inquiries yet.</div>
        ) : (
          <div className="booking-list">
            {inquiries.map((inq) => (
              <div key={inq.id} className="booking-row">
                <div>
                  <p className="booking-row-title">{inq.listings?.title}</p>
                  <p className="booking-row-sub">
                    From {inq.profiles?.full_name || 'a visitor'} — &ldquo;{inq.message}&rdquo;
                  </p>
                </div>
                {inq.status === 'new' ? (
                  <div className="booking-row-actions">
                    <button
                      type="button"
                      className="btn btn-accent btn-sm"
                      onClick={() => updateInquiryStatus(inq.id, 'responded')}
                    >
                      Mark responded
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => updateInquiryStatus(inq.id, 'closed')}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <span className={`status-pill status-${inq.status}`}>{inq.status}</span>
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