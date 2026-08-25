// src/components/HousingMap.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons for React/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Sub-component to pan and zoom map when a property is clicked in Chatbot
function MapRecenter({ selectedProperty, properties }) {
    const map = useMap()
    
    useEffect(() => {
        if (selectedProperty?.latitude && selectedProperty?.longitude) {
            map.flyTo([selectedProperty.latitude, selectedProperty.longitude], 16, { duration: 1.5 })
        } else if (properties.length > 0) {
            const valid = properties.filter(p => p.latitude && p.longitude)
            if (valid.length > 0) {
                const bounds = L.latLngBounds(valid.map(p => [p.latitude, p.longitude]))
                map.fitBounds(bounds, { padding: [50, 50] })
            }
        }
    }, [selectedProperty, properties, map])
    
    return null
}

export function HousingMap({ selectedProperty = null }) {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchProperties()
    }, [])

    const fetchProperties = async () => {
        try {
            setLoading(true)
            setError(null)
            
            // Querying your initial 'properties' table
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
            
            if (error) throw error
            setProperties(data || [])
        } catch (err) {
            console.error('Error fetching properties table:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return <div className="text-center text-red-600 p-4">Error loading map: {error}</div>
    }

    const defaultCenter = [-1.286389, 36.817223] // Nairobi default center

    return (
        <div className="w-full space-y-4">
            <div className="rounded-lg overflow-hidden shadow-lg" style={{ height: '550px' }}>
                <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {properties.map(item => (
                        <Marker
                            key={item.id}
                            position={[item.latitude, item.longitude]}
                        >
                            <Popup>
                                <div className="max-w-xs">
                                    <h3 className="font-semibold text-sm">{item.title}</h3>
                                    {item.location && <p className="text-xs text-gray-600 mt-1">📍 {item.location}</p>}
                                    <p className="text-sm font-bold text-blue-600 mt-1">
                                        KES {item.price ? Number(item.price).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    
                    <MapRecenter selectedProperty={selectedProperty} properties={properties} />
                </MapContainer>
            </div>
        </div>
    )
}