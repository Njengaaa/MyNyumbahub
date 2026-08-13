import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './ListingDetail.css';

function ListingDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadListing() {
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
      if (!error) setListing(data);
      setLoading(false);
    }
    loadListing();
  }, [id]);

  const handleRequestBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBooking(true);
    setMessage('');
    const { error } = await supabase.from('bookings').insert({
      listing_id: listing.id,
      tenant_id: user.id,
    });
    if (error) {
      setMessage(`Could not send request: ${error.message}`);
    } else {
      setMessage('Booking request sent! Track its status from your dashboard.');
    }
    setBooking(false);
  };

  if (loading) return <div className="route-loading">Loading…</div>;
  if (!listing) return <div className="route-loading">Listing not found.</div>;

  const images = listing.images?.length ? listing.images : [];

  return (
    <div className="listing-detail container">
      <Link to="/listings" className="back-link">
        ← Back to listings
      </Link>

      <h1>{listing.title}</h1>

      <div className="listing-detail-gallery">
        {images.length > 0 ? (
          <>
            <img src={images[activeImage]} alt={listing.title} className="listing-detail-main-image" />
            {images.length > 1 && (
              <div className="listing-detail-thumbs">
                {images.map((img, idx) => (
                  <button
                    type="button"
                    key={img}
                    className={idx === activeImage ? 'active' : ''}
                    onClick={() => setActiveImage(idx)}
                  >
                    <img src={img} alt={`${listing.title} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="listing-detail-main-image listing-detail-placeholder" />
        )}
      </div>

      <div className="listing-detail-info">
        <div>
          <p className="listing-detail-price">KES {listing.rent_amount.toLocaleString()} / month</p>
          <p className="listing-detail-location">
            {listing.area}, {listing.city}
          </p>
          <p className="listing-detail-meta">
            {listing.bedrooms} bed · {listing.bathrooms} bath
          </p>
          <p className="listing-detail-description">{listing.description}</p>
        </div>

        <div className="listing-detail-action">
          {profile?.role === 'landlord' ? (
            <p className="listing-detail-note">Landlord accounts can&rsquo;t request bookings.</p>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-accent btn-full"
                onClick={handleRequestBooking}
                disabled={booking}
              >
                {booking ? 'Sending…' : user ? 'Request to Book' : 'Sign in to Book'}
              </button>
              {message && <p className="listing-detail-message">{message}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingDetail;
