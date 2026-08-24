import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import './ListingDetail.css';

const pin = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function initials(name) {
  if (!name) return 'NH';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ListingDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [landlord, setLandlord] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');

  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState('');

  useEffect(() => {
    async function loadListing() {
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
      if (!error) {
        setListing(data);

        if (data.landlord_id) {
          const { data: landlordProfile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', data.landlord_id)
            .single();
          setLandlord(landlordProfile);
        }

        const { data: nearby } = await supabase
          .from('listings')
          .select('*')
          .eq('city', data.city)
          .neq('id', data.id)
          .limit(3);
        setSimilar(nearby || []);
      }
      setLoading(false);
    }
    loadListing();
  }, [id]);

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSendingInquiry(true);
    setInquiryStatus('');
    const { error } = await supabase.from('inquiries').insert({
      listing_id: listing.id,
      name: profile?.full_name || 'Nyumbahub tenant',
      email: user.email,
      message: inquiryMessage.trim() || null,
    });
    if (error) {
      setInquiryStatus(`Could not send message: ${error.message}`);
    } else {
      setInquiryStatus('Message sent — the landlord will reach out by email.');
      setInquiryMessage('');
    }
    setSendingInquiry(false);
  };

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
      setMessage('Request sent. Track its status from your dashboard.');
    }
    setBooking(false);
  };

  if (loading) return <div className="route-loading">Loading…</div>;
  if (!listing) return <div className="route-loading">Listing not found.</div>;

  const images = listing.images?.length ? listing.images : [];
  const mainImage = images[activeImage];
  const thumbSlots = [1, 2, 3, 4].map((i) => images[i] || images[0]);

  return (
    <div className="listing-detail container">
      <Link to="/listings" className="back-link">
        ← Back to listings
      </Link>

      <div className="ld-gallery">
        <div className="ld-gallery-main">
          {mainImage ? <img src={mainImage} alt={listing.title} /> : <div className="ld-image-placeholder" />}
          {listing.verified !== false && <span className="ld-verified-badge">✓ Verified</span>}
        </div>
        <div className="ld-gallery-grid">
          {thumbSlots.map((src, i) =>
            src ? (
              <button
                key={i}
                type="button"
                className={`ld-thumb ${i + 1 === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(i + 1)}
              >
                <img src={src} alt={`${listing.title} ${i + 2}`} />
              </button>
            ) : (
              <div key={i} className="ld-thumb ld-image-placeholder" />
            )
          )}
        </div>
      </div>

      <div className="ld-body">
        <div className="ld-main">
          <h1>{listing.title}</h1>
          <p className="ld-location">
            📍 {listing.area}, {listing.city}
          </p>

          <div className="ld-quickfacts">
            <span>🛏️ {listing.bedrooms} Bedrooms</span>
            <span>🛁 {listing.bathrooms} Bathrooms</span>
            {listing.size_sqm && <span>📐 {listing.size_sqm} sq m</span>}
            {listing.parking_slots != null && <span>🚗 {listing.parking_slots} Parking</span>}
          </div>

          <section className="ld-section">
            <h2>Description</h2>
            <p>{listing.description || 'No description provided yet.'}</p>
          </section>

          {listing.amenities?.length > 0 && (
            <section className="ld-section">
              <h2>Amenities</h2>
              <div className="ld-amenities-grid">
                {listing.amenities.map((a) => (
                  <div key={a} className="ld-amenity">
                    {a}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="ld-section">
            <h2>Location</h2>
            <div className="ld-map">
              <MapContainer
                center={[listing.lat, listing.lng]}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '260px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[listing.lat, listing.lng]} icon={pin} />
              </MapContainer>
            </div>
          </section>
        </div>

        <aside className="ld-sidebar">
          <div className="ld-price-card">
            <span className="ld-price-label">Property Price</span>
            <span className="ld-price">KES {listing.rent_amount.toLocaleString()}/mo</span>

            {profile?.role !== 'landlord' && (
              <button
                type="button"
                className="btn btn-outline btn-full ld-book-btn"
                onClick={handleRequestBooking}
                disabled={booking}
              >
                {booking ? 'Sending…' : user ? 'Request to Book' : 'Sign in to book'}
              </button>
            )}
            {message && <p className="ld-message">{message}</p>}
          </div>

          <div className="ld-contact-card">
            <h3>Contact Agent</h3>
            <div className="ld-agent ld-agent-standalone">
              <div className="ld-agent-avatar">{initials(landlord?.full_name)}</div>
              <div>
                <p className="ld-agent-name">{landlord?.full_name || 'Nyumbahub landlord'}</p>
                <p className="ld-agent-role">
                  {landlord?.phone ? `📞 ${landlord.phone}` : 'Listing owner'}
                </p>
              </div>
            </div>

            {landlord?.phone ? (
              <a href={`tel:${landlord.phone}`} className="btn btn-outline btn-full ld-call-btn">
                📞 Call Agent
              </a>
            ) : (
              <button type="button" className="btn btn-outline btn-full ld-call-btn" disabled>
                📞 No phone on file
              </button>
            )}

            <div className="ld-message-divider">or send a message</div>

            {user ? (
              <form onSubmit={handleSendInquiry}>
                <div className="form-field">
                  <textarea
                    rows={3}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder={`I'm interested in ${listing.title}. Please provide more details.`}
                  />
                </div>
                <button type="submit" className="btn btn-accent btn-full" disabled={sendingInquiry}>
                  {sendingInquiry ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            ) : (
              <button type="button" className="btn btn-accent btn-full" onClick={() => navigate('/login')}>
                Sign in to message agent
              </button>
            )}

            {inquiryStatus && <p className="ld-message">{inquiryStatus}</p>}
          </div>

          <div className="ld-insight-card">
            <span className="ld-insight-label">📊 Similar listings nearby</span>
            <p>
              See more homes in {listing.area} on the{' '}
              <Link to={`/listings?search=${encodeURIComponent(listing.area)}`}>listings map</Link>.
            </p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="ld-similar">
          <div className="ld-similar-header">
            <div>
              <h2>Similar Listings</h2>
              <p>Other homes in {listing.city}.</p>
            </div>
            <Link to="/listings" className="section-heading-link">
              View all →
            </Link>
          </div>
          <div className="ld-similar-grid">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ListingDetail;