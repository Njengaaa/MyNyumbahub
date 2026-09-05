import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Component to handle initial bounds and flying to selected property
function MapCenter({ markers, selectedProperty, markerRefs }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedProperty && markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [markers, selectedProperty, map])

  useEffect(() => {
    if (selectedProperty?.lat && selectedProperty?.lng) {
      const lat = Number(selectedProperty.lat)
      const lng = Number(selectedProperty.lng)

      map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 })

      const markerKey = selectedProperty.id || `${lat}-${lng}`
      const targetMarker = markerRefs.current[markerKey]

      if (targetMarker) {
        setTimeout(() => {
          targetMarker.openPopup()
        }, 1200)
      }
    }
  }, [selectedProperty, map, markerRefs])

  return null
}

// Display price: sale listings use sale_price, rent listings use rent_amount.
// Guards against the null-crash pattern (rent_amount is null on sale rows).
function getDisplayPrice(listing) {
  if (listing.listing_type === 'sale') return listing.sale_price ?? null
  return listing.rent_amount ?? null
}

// Color thresholds differ for sale (KES, millions) vs rent (KES/month, thousands)
function getMarkerColor(listing) {
  const price = getDisplayPrice(listing)
  if (price == null) return '#666666'

  if (listing.listing_type === 'sale') {
    if (price > 50000000) return '#8B0000'
    if (price > 20000000) return '#DC143C'
    if (price > 10000000) return '#FF8C00'
    if (price > 5000000) return '#228B22'
    return '#4169E1'
  }

  // rent
  if (price > 200000) return '#8B0000'
  if (price > 100000) return '#DC143C'
  if (price > 50000) return '#FF8C00'
  if (price > 20000) return '#228B22'
  return '#4169E1'
}

function createColoredMarker(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.6);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  })
}

export default function HousingMapPage({ selectedProperty }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  const markerRefs = useRef({})

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedBedrooms, setSelectedBedrooms] = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [listingKind, setListingKind] = useState('all') // 'all' | 'rent' | 'sale'

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error, count } = await supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .limit(500)

      if (error) throw error
      setListings(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching listings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      if (listingKind !== 'all' && listing.listing_type !== listingKind) return false

      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
          listing.title?.toLowerCase().includes(search) ||
          listing.area?.toLowerCase().includes(search) ||
          listing.city?.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      const price = getDisplayPrice(listing)
      if (minPrice && (price == null || price < Number(minPrice))) return false
      if (maxPrice && (price == null || price > Number(maxPrice))) return false
      if (selectedBedrooms && listing.bedrooms !== Number(selectedBedrooms)) return false
      if (selectedTypes.length > 0 && !selectedTypes.includes(listing.property_type)) return false

      return true
    })
  }, [listings, searchTerm, minPrice, maxPrice, selectedBedrooms, selectedTypes, listingKind])

  const propertyTypes = useMemo(() => {
    const types = new Set()
    listings.forEach(l => {
      if (l.property_type) types.add(l.property_type)
    })
    return Array.from(types)
  }, [listings])

  const bedroomOptions = useMemo(() => {
    const counts = new Set()
    listings.forEach(l => {
      if (l.bedrooms) counts.add(l.bedrooms)
    })
    return Array.from(counts).sort((a, b) => a - b)
  }, [listings])

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setMinPrice('')
    setMaxPrice('')
    setSelectedBedrooms('')
    setSelectedTypes([])
    setListingKind('all')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e0e0e0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem' }}>Loading listings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <h3>Error loading listings</h3>
          <p>{error}</p>
          <button
            onClick={fetchListings}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const center = selectedProperty?.lat && selectedProperty?.lng
    ? [selectedProperty.lat, selectedProperty.lng]
    : listings.length > 0
      ? [listings[0].lat, listings[0].lng]
      : [-1.2864, 36.8172]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0f2f5' }}>
      {/* Filter bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.75rem 1.5rem',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 1000,
        alignItems: 'center',
        flexShrink: 0
      }}>
        <input
          type="text"
          placeholder="Search location or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            width: '250px',
            outline: 'none'
          }}
        />

        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            width: '100px',
            outline: 'none'
          }}
        />

        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            width: '100px',
            outline: 'none'
          }}
        />

        <select
          value={selectedBedrooms}
          onChange={(e) => setSelectedBedrooms(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            background: 'white',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">All bedrooms</option>
          {bedroomOptions.map(b => (
            <option key={b} value={b}>{b} bedroom{b > 1 ? 's' : ''}</option>
          ))}
        </select>

        <button
          onClick={clearFilters}
          style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Rent/Sale + property type filter chips */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1.5rem',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>Listing:</span>
        {['all', 'rent', 'sale'].map(kind => (
          <button
            key={kind}
            onClick={() => setListingKind(kind)}
            style={{
              padding: '0.25rem 0.75rem',
              border: listingKind === kind ? '1px solid #2563eb' : '1px solid #d1d5db',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              background: listingKind === kind ? '#2563eb' : 'white',
              color: listingKind === kind ? 'white' : 'inherit',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {kind === 'all' ? 'All' : kind === 'rent' ? 'For Rent' : 'For Sale'}
          </button>
        ))}

        {propertyTypes.length > 0 && (
          <>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0.5rem' }}>Property type:</span>
            {propertyTypes.map(type => (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                style={{
                  padding: '0.25rem 0.75rem',
                  border: selectedTypes.includes(type) ? '1px solid #2563eb' : '1px solid #d1d5db',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  background: selectedTypes.includes(type) ? '#2563eb' : 'white',
                  color: selectedTypes.includes(type) ? 'white' : 'inherit',
                  cursor: 'pointer'
                }}
              >
                {type}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredListings.map(listing => {
            const color = getMarkerColor(listing)
            const markerKey = listing.id || `${listing.lat}-${listing.lng}`
            const price = getDisplayPrice(listing)

            return (
              <Marker
                key={markerKey}
                ref={(ref) => {
                  if (ref) markerRefs.current[markerKey] = ref
                }}
                position={[listing.lat, listing.lng]}
                icon={createColoredMarker(color)}
              >
                <Popup>
                  <div style={{ minWidth: '200px', maxWidth: '260px' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600 }}>{listing.title}</h4>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#6b7280' }}>
                      📍 {listing.area}{listing.city ? `, ${listing.city}` : ''}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#2563eb' }}>
                      {price != null
                        ? `KSh ${price.toLocaleString()}${listing.listing_type === 'rent' ? '/mo' : ''}`
                        : 'Price on request'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                      <span style={{ background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>🏠 {listing.bedrooms} beds</span>
                      {listing.size_sqm && (
                        <span style={{ background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>📐 {listing.size_sqm} sqm</span>
                      )}
                      {listing.property_type && (
                        <span style={{ background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{listing.property_type}</span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          <MapCenter
            markers={filteredListings}
            selectedProperty={selectedProperty}
            markerRefs={markerRefs}
          />
        </MapContainer>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '0.5rem 1.5rem',
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Listings</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{totalCount}</span>
        </div>
        <span style={{ color: '#d1d5db' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Showing</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{filteredListings.length}</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        right: '20px',
        background: 'white',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        fontSize: '0.75rem'
      }}>
        <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#374151' }}>Price Category</h5>
        {[
          { color: '#8B0000', label: 'Highest' },
          { color: '#DC143C', label: 'High' },
          { color: '#FF8C00', label: 'Mid' },
          { color: '#228B22', label: 'Affordable' },
          { color: '#4169E1', label: 'Budget' }
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.125rem 0' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></span>
            <span>{item.label}</span>
          </div>
        ))}
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.65rem', color: '#9ca3af' }}>Scale differs for rent vs. sale</p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}