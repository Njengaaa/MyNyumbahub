// Shared coordinate lookup for common Nairobi & Kiambu neighbourhoods.
// Used to auto-fill lat/lng when a landlord adds a listing, and to center the map.
export const AREA_COORDS = {
  Kilimani: { lat: -1.2921, lng: 36.7873, city: 'Nairobi' },
  Kileleshwa: { lat: -1.2833, lng: 36.7833, city: 'Nairobi' },
  Lavington: { lat: -1.2792, lng: 36.7669, city: 'Nairobi' },
  Westlands: { lat: -1.2673, lng: 36.8062, city: 'Nairobi' },
  Karen: { lat: -1.3192, lng: 36.7076, city: 'Nairobi' },
  Madaraka: { lat: -1.3095, lng: 36.8172, city: 'Nairobi' },
  'South B': { lat: -1.3167, lng: 36.8333, city: 'Nairobi' },
  'South C': { lat: -1.3181, lng: 36.8231, city: 'Nairobi' },
  Kasarani: { lat: -1.2231, lng: 36.8989, city: 'Nairobi' },
  Embakasi: { lat: -1.3229, lng: 36.8945, city: 'Nairobi' },
  Ngong: { lat: -1.3524, lng: 36.6579, city: 'Kajiado' },
  Rongai: { lat: -1.3958, lng: 36.7517, city: 'Kajiado' },
  Ruaka: { lat: -1.2129, lng: 36.7815, city: 'Kiambu' },
  Ruiru: { lat: -1.1489, lng: 36.9622, city: 'Kiambu' },
  Kikuyu: { lat: -1.2469, lng: 36.6636, city: 'Kiambu' },
  Juja: { lat: -1.1036, lng: 37.0142, city: 'Kiambu' },
  Kahawa: { lat: -1.1861, lng: 36.9294, city: 'Kiambu' },
  Githurai: { lat: -1.1858, lng: 36.9106, city: 'Kiambu' },
  Thika: { lat: -1.0396, lng: 37.0900, city: 'Kiambu' },
};

export const AREA_NAMES = Object.keys(AREA_COORDS);

// Center point roughly between Nairobi CBD and Kiambu county.
export const MAP_CENTER = [-1.27, 36.82];
export const MAP_ZOOM = 10;
