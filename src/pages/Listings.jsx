import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import ListingsMap from '../components/ListingsMap';
import ListingCard from '../components/ListingCard';
import './Listings.css';

function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
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

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchesSearch =
        !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.area.toLowerCase().includes(search.toLowerCase()) ||
        l.city.toLowerCase().includes(search.toLowerCase());
      const matchesPrice = !maxPrice || l.rent_amount <= Number(maxPrice);
      return matchesSearch && matchesPrice;
    });
  }, [listings, search, maxPrice]);

  return (
    <div className="listings-page container">
      <div className="listings-header">
        <h1>Available Homes</h1>
        <p>{filtered.length} listing{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      <div className="listings-controls">
        <input
          type="text"
          placeholder="Search by area, city, or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max price (KES)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <div className="view-toggle">
          <button
            type="button"
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
          >
            Grid
          </button>
          <button
            type="button"
            className={view === 'map' ? 'active' : ''}
            onClick={() => setView('map')}
          >
            Map
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading listings…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No listings match your search.</div>
      ) : view === 'grid' ? (
        <div className="listings-grid">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <ListingsMap listings={filtered} />
      )}
    </div>
  );
}

export default Listings;
