import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ListingsMap from '../components/ListingsMap';
import './Listings.css';

const LISTING_TYPES = [
  { label: 'All', value: 'all' },
  { label: 'For Rent', value: 'rent' },
  { label: 'For Sale', value: 'sale' },
];

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

// Rent and sale prices live on completely different scales,
// so the slider bounds reset whenever the listing type changes.
const PRICE_RANGES = {
  all: { floor: 0, ceil: 50000000, step: 500000 },
  rent: { floor: 0, ceil: 350000, step: 5000 },
  sale: { floor: 0, ceil: 50000000, step: 500000 },
};

// A listing's "price" means different columns depending on its type —
// centralize that here so filtering/sorting/display never fork three ways.
function getListingPrice(listing) {
  return listing.listing_type === 'sale' ? listing.sale_price : listing.rent_amount;
}

function formatListingPrice(listing) {
  const price = getListingPrice(listing);
  if (price == null) return 'Price on request';
  const isSale = listing.listing_type === 'sale';
  if (isSale) return `KES ${price.toLocaleString()}`;
  return `KES ${price >= 1000 ? `${Math.round(price / 1000)}k` : price}/mo`;
}

function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(() => new Set());

  const initialType = searchParams.get('type') || 'all';
  const [listingType, setListingType] = useState(initialType);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [priceMin, setPriceMin] = useState(PRICE_RANGES[initialType].floor);
  const [priceMax, setPriceMax] = useState(PRICE_RANGES[initialType].ceil);
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

  const handleListingTypeChange = (value) => {
    setListingType(value);
    setPriceMin(PRICE_RANGES[value].floor);
    setPriceMax(PRICE_RANGES[value].ceil);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'all') next.delete('type');
      else next.set('type', value);
      return next;
    });
  };

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
    setPriceMin(PRICE_RANGES[listingType].floor);
    setPriceMax(PRICE_RANGES[listingType].ceil);
    setBedrooms(null);
    setBathrooms(null);
    setPropertyTypes([]);
  };

  const filtered = useMemo(() => {
    let result = listings.filter((l) => {
      const matchesListingType = listingType === 'all' || l.listing_type === listingType;

      const matchesSearch =
        !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.area.toLowerCase().includes(search.toLowerCase()) ||
        l.city.toLowerCase().includes(search.toLowerCase());

      const price = getListingPrice(l);
      const matchesPrice = price == null || (price >= priceMin && price <= priceMax);

      const matchesBedrooms =
        bedrooms == null || (bedrooms === 4 ? l.bedrooms >= 4 : l.bedrooms === bedrooms);
      const matchesBathrooms =
        bathrooms == null || (bathrooms === 3 ? l.bathrooms >= 3 : l.bathrooms === bathrooms);
      const matchesType =
        propertyTypes.length === 0 || propertyTypes.includes(l.property_type || 'Apartment');

      return (
        matchesListingType &&
        matchesSearch &&
        matchesPrice &&
        matchesBedrooms &&
        matchesBathrooms &&
        matchesType
      );
    });

    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => (getListingPrice(a) ?? 0) - (getListingPrice(b) ?? 0));
    }
    if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => (getListingPrice(b) ?? 0) - (getListingPrice(a) ?? 0));
    }

    return result;
  }, [listings, listingType, search, priceMin, priceMax, bedrooms, bathrooms, propertyTypes, sortBy]);

  const typeLabel =
    listingType === 'rent' ? 'Rentals' : listingType === 'sale' ? 'Homes for Sale' : 'All Listings';
  const headingLabel = search ? `${typeLabel} in ${search}` : typeLabel;

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

      <div className="listing-type-toggle" role="tablist" aria-label="Listing type">
        {LISTING_TYPES.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={listingType === opt.value}
            className={listingType === opt.value ? 'active' : ''}
            onClick={() => handleListingTypeChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

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
                  min={PRICE_RANGES[listingType].floor}
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
                  max={PRICE_RANGES[listingType].ceil}
                  onChange={(e) => setPriceMax(Number(e.target.value) || PRICE_RANGES[listingType].ceil)}
                />
              </div>
            </div>
            <input
              type="range"
              min={PRICE_RANGES[listingType].floor}
              max={PRICE_RANGES[listingType].ceil}
              step={PRICE_RANGES[listingType].step}
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
              {filtered.map((listing) => {
                const isSale = listing.listing_type === 'sale';
                return (
                  <div key={listing.id} className="lg-card">
                    <div className="lg-card-image-wrap">
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt={listing.title} />
                      ) : (
                        <div className="lg-card-image-placeholder" />
                      )}

                      <div className="lg-badge-stack">
                        <span className={`lg-badge ${isSale ? 'lg-badge-sale' : 'lg-badge-rent'}`}>
                          {isSale ? 'For Sale' : 'For Rent'}
                        </span>
                        {listing.featured && (
                          <span className="lg-badge lg-badge-featured">Featured</span>
                        )}
                        {!listing.featured && listing.verified !== false && (
                          <span className="lg-badge lg-badge-verified">✓ Verified</span>
                        )}
                      </div>

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
                        <span className="lg-price">{formatListingPrice(listing)}</span>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Listings;