import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER, MAP_ZOOM } from '../areaCoords';
import './ListingsMap.css';
import { HousingMap } from '../components/HousingMap'

export function Home() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Nairobi Housing Market</h1>
            <p className="text-gray-600 mb-6">Explore properties across Nairobi and surrounding areas</p>
            <HousingMap />
        </div>
    )
}
// Leaflet's default marker icons don't resolve correctly under Vite's bundler,
// so we rebuild the icon from the CDN-hosted images.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ListingsMap({ listings }) {
  const mappable = listings.filter((l) => l.lat && l.lng);

  return (
    <div className="listings-map-wrap">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        scrollWheelZoom={false}
        className="listings-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map((listing) => (
          <Marker key={listing.id} position={[listing.lat, listing.lng]} icon={markerIcon}>
            <Popup>
              <div className="listings-map-popup">
                <strong>{listing.title}</strong>
                <span>
                  {listing.area}, {listing.city}
                </span>
                <span>KES {listing.rent_amount.toLocaleString()}/mo</span>
                <Link to={`/listings/${listing.id}`}>View details →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default ListingsMap;
