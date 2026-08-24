import { useEffect, useState, useMemo, useRef } from 'react'
import { SupabaseHousing } from '../SupabaseHousing'
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

  // Handles auto-fit bounds on initial data load
  useEffect(() => {
    if (!selectedProperty && markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lon]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [markers, selectedProperty, map])

  // Handles flying to selected property and opening popup
  useEffect(() => {
    if (selectedProperty?.lat && selectedProperty?.lon) {
      const lat = Number(selectedProperty.lat)
      const lng = Number(selectedProperty.lon)

      map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 })

      const markerKey = selectedProperty.id || `${lat}-${lng}`
      const targetMarker = markerRefs.current[markerKey]

      let timeoutId = null 
      
      if (targetMarker) {
       timeoutId = setTimeout(() => {
          targetMarker.openPopup()
        }, 1200)
      }
    }
  }, [selectedProperty, map, markerRefs])

  return null
}

// Color mapping for price categories
const getMarkerColor = (price) => {
  if (!price) return '#666666'
  if (price > 50000000) return '#8B0000'
  if (price > 20000000) return '#DC143C'
  if (price > 10000000) return '#FF8C00'
  if (price > 5000000) return '#228B22'
  return '#4169E1'
}

// Custom marker with color
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
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  
  // Ref map to store Leaflet marker instances by property key/ID
  const markerRefs = useRef({})

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedBedrooms, setSelectedBedrooms] = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error, count } = await SupabaseHousing
        .from('properties')
        .select('*', { count: 'exact' })
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .limit(500)
      
      if (error) throw error
      setProperties(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching properties:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch = 
          prop.title?.toLowerCase().includes(search) ||
          prop.location?.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }
      
      if (minPrice && prop.price < Number(minPrice)) return false
      if (maxPrice && prop.price > Number(maxPrice)) return false
      if (selectedBedrooms && prop.bedrooms !== Number(selectedBedrooms)) return false
      if (selectedTypes.length > 0 && !selectedTypes.includes(prop.property_type)) return false
      
      return true
    })
  }, [properties, searchTerm, minPrice, maxPrice, selectedBedrooms, selectedTypes])

  const propertyTypes = useMemo(() => {
    const types = new Set()
    properties.forEach(p => {
      if (p.property_type) types.add(p.property_type)
    })
    return Array.from(types)
  }, [properties])

  const bedroomOptions = useMemo(() => {
    const counts = new Set()
    properties.forEach(p => {
      if (p.bedrooms) counts.add(p.bedrooms)
    })
    return Array.from(counts).sort((a, b) => a - b)
  }, [properties])

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
          <p style={{ marginTop: '1rem' }}>Loading properties...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <h3>Error loading properties</h3>
          <p>{error}</p>
          <button 
            onClick={fetchProperties}
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

  const center = selectedProperty?.lat && selectedProperty?.lon 
    ? [selectedProperty.lat, selectedProperty.lon]
    : properties.length > 0 
      ? [properties[0].lat, properties[0].lon]
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

      {/* Property type filter chips */}
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
        <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>Property type:</span>
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
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Map Container */}
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
          
          {filteredProperties.map(prop => {
            const color = getMarkerColor(prop.price)
            const markerKey = prop.id || `${prop.lat}-${prop.lon}`
            
            return (
              <Marker
                key={markerKey}
                ref={(ref) => {
                  if (ref) markerRefs.current[markerKey] = ref
                }}
                position={[prop.lat, prop.lon]}
                icon={createColoredMarker(color)}
              >
                <Popup>
                  <div style={{ minWidth: '200px', maxWidth: '260px' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600 }}>{prop.title}</h4>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#6b7280' }}>📍 {prop.location}</p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#2563eb' }}>
                      KSh {prop.price?.toLocaleString()}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                      <span style={{ background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>🏠 {prop.bedrooms} beds</span>
                      <span style={{ background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>📐 {prop.sqft} sqft</span>
                      <span style={{ background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{prop.property_type}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
          
          <MapCenter 
            markers={filteredProperties} 
            selectedProperty={selectedProperty} 
            markerRefs={markerRefs} 
          />
        </MapContainer>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyComtent: 'center',
        gap: '1.5rem',
        padding: '0.5rem 1.5rem',
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Properties</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{totalCount}</span>
        </div>
        <span style={{ color: '#d1d5db' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Showing</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{filteredProperties.length}</span>
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
          { color: '#8B0000', label: 'Ultra-Luxury (>50M)' },
          { color: '#DC143C', label: 'Luxury (20-50M)' },
          { color: '#FF8C00', label: 'Mid-Range (10-20M)' },
          { color: '#228B22', label: 'Affordable (5-10M)' },
          { color: '#4169E1', label: 'Budget (<5M)' }
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.125rem 0' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}