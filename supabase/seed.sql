INSERT INTO listings (
  title, 
  description, 
  rent_amount, 
  bedrooms, 
  bathrooms, 
  area, 
  city, 
  lat, 
  lng, 
  images
) VALUES 
(
  'Modern 2 Bedroom Apartment in Kilimani', 
  'Spacious 2-bedroom apartment with modern finishes, balcony, fast Wi-Fi, and 24/7 security.', 
  45000, 
  2, 
  2, 
  'Kilimani', 
  'Nairobi', 
  -1.2874, 
  36.7845, 
  ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80']
),
(
  'Luxury Villa with Garden', 
  'Exclusive 4-bedroom villa featuring private parking, lush garden, and top-tier security.', 
  120000, 
  4, 
  4, 
  'Karen', 
  'Nairobi', 
  -1.3328, 
  36.7816, 
  ARRAY['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80']
),
(
  'Cozy Studio Apartment', 
  'Affordable and cozy studio unit close to shopping malls and public transport routes.', 
  22000, 
  1, 
  1, 
  'Roysambu', 
  'Nairobi', 
  -1.2208, 
  36.9012, 
  ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80']
),
(
  'Executive 3 Bed Apartment', 
  'Charming 3-bedroom unit with master ensuite, gym access, and backup generator.', 
  65000, 
  3, 
  2, 
  'Westlands', 
  'Nairobi', 
  -1.2683, 
  36.8117, 
  ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80']
),
(
  'Charming 1 Bedroom Haven', 
  'Fully furnished 1 bedroom apartment ideal for young professionals or students.', 
  30000, 
  1, 
  1, 
  'Lavington', 
  'Nairobi', 
  -1.2789, 
  36.7722, 
  ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80']
);