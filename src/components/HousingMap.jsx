import { useEffect, useState, useRef } from 'react'
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
        if (markers.length > 0) {
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

export function HousingMap() {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        fetchProperties()
    }, [])

    const fetchProperties = async () => {
        try {
            setLoading(true)
            setError(null)
            
            // Fetch properties with coordinates
            const { data, error, count } = await supabaseHousing
                .from('housing_data')
                .select('*', { count: 'exact' })
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .limit(500) // Limit for performance
            
            if (error) {
                throw error
            }
            
            setProperties(data || [])
            setTotalCount(count || 0)
        } catch (err) {
            console.error('Error fetching properties:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading properties...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center text-red-600">
                    <p className="text-lg font-semibold">Error loading properties</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        )
    }

    if (properties.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center text-gray-600">
                    <p className="text-lg font-semibold">No properties with coordinates</p>
                    <p className="text-sm">Try geocoding more locations</p>
                </div>
            </div>
        )
    }

    const center = [properties[0]?.latitude || -1.2864, properties[0]?.longitude || 36.8172]

    return (
        <div className="space-y-4">
            {/* Stats bar */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <span className="text-sm text-gray-600">Showing:</span>
                    <span className="ml-2 font-semibold">{properties.length} properties</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-sm text-gray-600">Total with coordinates:</span>
                    <span className="ml-2 font-semibold">{totalCount}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1 text-xs">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#8B0000' }}></span>
                        Ultra-Luxury
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#DC143C' }}></span>
                        Luxury
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#FF8C00' }}></span>
                        Mid-Range
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#228B22' }}></span>
                        Affordable
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#4169E1' }}></span>
                        Budget
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="rounded-lg overflow-hidden shadow-lg" style={{ height: '500px' }}>
                <MapContainer
                    center={center}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {properties.map(prop => {
                        const color = getMarkerColor(prop.price_category)
                        return (
                            <Marker
                                key={prop.id}
                                position={[prop.latitude, prop.longitude]}
                                icon={createColoredMarker(color)}
                            >
                                <Popup>
                                    <div className="max-w-xs">
                                        <h3 className="font-semibold text-sm">{prop.title}</h3>
                                        <p className="text-xs text-gray-600 mt-1">📍 {prop.location}</p>
                                        <p className="text-sm font-bold text-blue-600 mt-1">
                                            KSh {prop.price?.toLocaleString()}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                            <span className="bg-gray-100 px-2 py-1 rounded">
                                                🏠 {prop.bedrooms} beds
                                            </span>
                                            <span className="bg-gray-100 px-2 py-1 rounded">
                                                📐 {prop.size_sqm} sqm
                                            </span>
                                            <span className="bg-gray-100 px-2 py-1 rounded">
                                                {prop.property_type}
                                            </span>
                                        </div>
                                        {prop.price_category && (
                                            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                                                prop.price_category === 'Ultra-Luxury (>50M)' ? 'bg-red-100 text-red-800' :
                                                prop.price_category === 'Luxury (20-50M)' ? 'bg-orange-100 text-orange-800' :
                                                prop.price_category === 'Mid-Range (10-20M)' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {prop.price_category}
                                            </span>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                    
                    <MapCenter markers={properties} />
                </MapContainer>
            </div>
        </div>
    )
}