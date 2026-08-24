import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ListingsMap from '../components/ListingsMap';
import './Listings.css';
 
const BEDROOM_OPTIONS = [
  { label: 'Studio', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4+', value: 4 },
];
 
const BATHROOM_OPTIONS = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3+', value: 3 },
];
 
const PROPERTY_TYPES = ['Apartment', 'Penthouse', 'Duplex', 'Serviced Apartment'];
 
const PRICE_FLOOR = 0;
const PRICE_CEIL = 350000;
 
function Listings() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(() => new Set());
 
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [priceMin, setPriceMin] = useState(PRICE_FLOOR);
  const [priceMax, setPriceMax] = useState(PRICE_CEIL);
  const [bedrooms, setBedrooms] = useState(null);
  const [bathrooms, setBathrooms] = useState(null);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [view, setView] = useState('grid'); // 'grid' | 'map'
 
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
 
  const toggleSave = (id) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
 
  const togglePropertyType = (type) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };
 
  const resetFilters = () => {
    setSearch('');
    setPriceMin(PRICE_FLOOR);
    setPriceMax(PRICE_CEIL);
    setBedrooms(null);
    setBathrooms(null);
    setPropertyTypes([]);
  };
 
  const filtered = useMemo(() => {
    let result = listings.filter((l) => {
      const matchesSearch =
        !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.area.toLowerCase().includes(search.toLowerCase()) ||
        l.city.toLowerCase().includes(search.toLowerCase());
 
      const matchesPrice = l.rent_amount >= priceMin && l.rent_amount <= priceMax;
      const matchesBedrooms =
        bedrooms == null || (bedrooms === 4 ? l.bedrooms >= 4 : l.bedrooms === bedrooms);
      const matchesBathrooms =
        bathrooms == null || (bathrooms === 3 ? l.bathrooms >= 3 : l.bathrooms === bathrooms);
      const matchesType =
        propertyTypes.length === 0 || propertyTypes.includes(l.property_type || 'Apartment');
 
      return matchesSearch && matchesPrice && matchesBedrooms && matchesBathrooms && matchesType;
    });
 
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.rent_amount - b.rent_amount);
    if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.rent_amount - a.rent_amount);
 
    return result;
  }, [listings, search, priceMin, priceMax, bedrooms, bathrooms, propertyTypes, sortBy]);
 
  const headingLabel = search ? `Listings in ${search}` : 'All Listings';
 
  return (
    <div className="listings-page container">
      <nav className="listings-breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <span>Listings</span>
        {search && (
          <>
            <span>›</span>
            <span>{search}</span>
          </>
        )}
      </nav>
 
      <div className="listings-header">
        <div>
          <h1>{headingLabel}</h1>
          <p>
            Showing {filtered.length} verified propert{filtered.length === 1 ? 'y' : 'ies'}
            {search ? ` in ${search}` : ''}
          </p>
        </div>
        <div className="listings-sort">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>
 
      <div className="listings-layout">
        <aside className="listings-filters">
          <div className="filters-head">
            <h2>Filters</h2>
            <button type="button" onClick={resetFilters}>
              Reset All
            </button>
          </div>
 
          <input
            type="text"
            className="filters-search"
            placeholder="Search area or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
 
          <div className="filter-group">
            <h3>Price Range (KES)</h3>
            <div className="price-inputs">
              <div>
                <span>Min</span>
                <input
                  type="number"
                  value={priceMin}
                  min={PRICE_FLOOR}
                  max={priceMax}
                  onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <span>Max</span>
                <input
                  type="number"
                  value={priceMax}
                  min={priceMin}
                  max={PRICE_CEIL}
                  onChange={(e) => setPriceMax(Number(e.target.value) || PRICE_CEIL)}
                />
              </div>
            </div>
            <input
              type="range"
              min={PRICE_FLOOR}
              max={PRICE_CEIL}
              step={5000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="price-slider"
            />
          </div>
 
          <div className="filter-group">
            <h3>Bedrooms</h3>
            <div className="chip-row">
              {BEDROOM_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={bedrooms === opt.value ? 'chip active' : 'chip'}
                  onClick={() => setBedrooms(bedrooms === opt.value ? null : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
 
          <div className="filter-group">
            <h3>Bathrooms</h3>
            <div className="chip-row">
              {BATHROOM_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={bathrooms === opt.value ? 'chip active' : 'chip'}
                  onClick={() => setBathrooms(bathrooms === opt.value ? null : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
 
          <div className="filter-group">
            <h3>Property Type</h3>
            <div className="checkbox-list">
              {PROPERTY_TYPES.map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={propertyTypes.includes(type)}
                    onChange={() => togglePropertyType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
 
          <div className="view-toggle filters-view-toggle">
            <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>
              Grid
            </button>
            <button type="button" className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
              Map
            </button>
          </div>
        </aside>
 
        <div className="listings-results">
          {loading ? (
            <div className="empty-state">Loading listings…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No listings match your filters.</div>
          ) : view === 'map' ? (
            <ListingsMap listings={filtered} />
          ) : (
            <div className="listings-grid-detailed">
              {filtered.map((listing) => (
                <div key={listing.id} className="lg-card">
                  <div className="lg-card-image-wrap">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} />
                    ) : (
                      <div className="lg-card-image-placeholder" />
                    )}
                    {listing.featured ? (
                      <span className="lg-badge lg-badge-featured">Featured</span>
                    ) : listing.verified !== false ? (
                      <span className="lg-badge lg-badge-verified">✓ Verified</span>
                    ) : null}
                    <button
                      type="button"
                      className={`lg-save ${saved.has(listing.id) ? 'active' : ''}`}
                      onClick={() => toggleSave(listing.id)}
                      aria-label="Save listing"
                    >
                      {saved.has(listing.id) ? '♥' : '♡'}
                    </button>
                  </div>
 
                  <div className="lg-card-body">
                    <div className="lg-card-title-row">
                      <h4>{listing.title}</h4>
                      <span className="lg-price">
                        KES {listing.rent_amount >= 1000
                          ? `${Math.round(listing.rent_amount / 1000)}k`
                          : listing.rent_amount}
                        /mo
                      </span>
                    </div>
                    <p className="lg-location">
                      📍 {listing.area}, {listing.city}
                    </p>
 
                    <div className="lg-facts">
                      <span>🛏️ {listing.bedrooms} Bed</span>
                      <span>🛁 {listing.bathrooms} Bath</span>
                      {listing.size_sqm && <span>📐 {listing.size_sqm} sqft</span>}
                    </div>
 
                    {listing.amenities?.length > 0 && (
                      <div className="lg-amenities">
                        {listing.amenities.slice(0, 3).map((a) => (
                          <span key={a}>{a}</span>
                        ))}
                      </div>
                    )}
 
                    <Link to={`/listings/${listing.id}`} className="btn btn-accent btn-full lg-cta">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 
export default Listings;
 
