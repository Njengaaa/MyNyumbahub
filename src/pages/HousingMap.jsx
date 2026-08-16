import { useEffect, useState, useMemo } from 'react'
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

// Component to center map on markers
function MapCenter({ markers }) {
    const map = useMap()
    
    useEffect(() => {
        if (markers && markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]))
            map.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [markers, map])
    
    return null
}

// Color mapping for price categories
const getMarkerColor = (category) => {
    const colors = {
        'Ultra-Luxury (>50M)': '#8B0000',
        'Luxury (20-50M)': '#DC143C',
        'Mid-Range (10-20M)': '#FF8C00',
        'Affordable (5-10M)': '#228B22',
        'Budget (<5M)': '#4169E1',
    }
    return colors[category] || '#666666'
}

// Custom marker with color
function createColoredMarker(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8],
    })
}

export default function HousingMapPage() {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [totalCount, setTotalCount] = useState(0)
    
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
            
            // Get the data
            const { data, error, count } = await SupabaseHousing
                .from('housing_data')
                .select('*', { count: 'exact' })
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
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
            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase()
                const matchesSearch = 
                    prop.title?.toLowerCase().includes(search) ||
                    prop.location?.toLowerCase().includes(search)
                if (!matchesSearch) return false
            }
            
            // Price filters
            if (minPrice && prop.price < Number(minPrice)) return false
            if (maxPrice && prop.price > Number(maxPrice)) return false
            
            // Bedroom filter
            if (selectedBedrooms && prop.bedrooms !== Number(selectedBedrooms)) return false
            
            // Property type filter
            if (selectedTypes.length > 0 && !selectedTypes.includes(prop.property_type)) return false
            
            return true
        })
    }, [properties, searchTerm, minPrice, maxPrice, selectedBedrooms, selectedTypes])

    // Get unique property types for filter
    const propertyTypes = useMemo(() => {
        const types = new Set()
        properties.forEach(p => {
            if (p.property_type) types.add(p.property_type)
        })
        return Array.from(types)
    }, [properties])

    // Get unique bedroom counts for filter
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

    const center = properties.length > 0 
        ? [properties[0].latitude, properties[0].longitude]
        : [-1.2864, 36.8172]

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh',
            background: '#f0f2f5'
        }}>
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
                    
                    {filteredProperties.map(prop => {
                        const color = getMarkerColor(prop.price_category)
                        return (
                            <Marker
                                key={prop.id}
                                position={[prop.latitude, prop.longitude]}
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
                                            <span style={{ background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>📐 {prop.size_sqm} sqm</span>
                                            <span style={{ background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{prop.property_type}</span>
                                        </div>
                                        {prop.price_category && (
                                            <span style={{
                                                display: 'inline-block',
                                                fontSize: '0.65rem',
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontWeight: 500,
                                                background: prop.price_category.includes('Ultra') ? '#fecaca' : 
                                                           prop.price_category.includes('Luxury') ? '#fed7aa' :
                                                           prop.price_category.includes('Mid') ? '#fde68a' :
                                                           prop.price_category.includes('Affordable') ? '#bbf7d0' : '#bfdbfe',
                                                color: prop.price_category.includes('Ultra') ? '#7f1d1d' :
                                                       prop.price_category.includes('Luxury') ? '#7c2d12' :
                                                       prop.price_category.includes('Mid') ? '#78350f' :
                                                       prop.price_category.includes('Affordable') ? '#14532d' : '#1e3a5f'
                                            }}>
                                                {prop.price_category}
                                            </span>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                    
                    <MapCenter markers={filteredProperties} />
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
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Properties</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{totalCount}</span>
                </div>
                <span style={{ color: '#d1d5db' }}>|</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Showing</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{filteredProperties.length}</span>
                </div>
                <span style={{ color: '#d1d5db' }}>|</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>With Coordinates</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{properties.length}</span>
                </div>
                <span style={{ color: '#d1d5db' }}>|</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Avg Price</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
                        {properties.length > 0 
                            ? `KSh ${(properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length / 1000000).toFixed(1)}M`
                            : 'N/A'
                        }
                    </span>
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
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: 1000,
                minWidth: '120px',
                fontSize: '0.75rem'
            }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Price Category</h5>
                {[
                    { color: '#8B0000', label: 'Ultra-Luxury' },
                    { color: '#DC143C', label: 'Luxury' },
                    { color: '#FF8C00', label: 'Mid-Range' },
                    { color: '#228B22', label: 'Affordable' },
                    { color: '#4169E1', label: 'Budget' }
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.125rem 0' }}>
                        <span style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            display: 'inline-block', 
                            backgroundColor: item.color,
                            border: '1px solid rgba(0,0,0,0.1)'
                        }}></span>
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