-- Sample listings so the site isn't empty on first run.
-- Run this AFTER schema.sql, in the same SQL Editor.
-- landlord_id is left null (these are demo listings, unowned by any account).

insert into public.listings
  (title, area, city, lat, lng, rent_amount, bedrooms, bathrooms, description, images)
values
  (
    '2 Bedroom Apartment', 'Kilimani', 'Nairobi', -1.2921, 36.7873,
    45000, 4, 2,
    'Bright, modern 4-bedroom apartment close to Yaya Centre, with backup water and secure parking.',
    array[
      'https://i.roamcdn.net/prop/brk/gallery-full-1200w-watermark/EReBQjwVaxAdlsIni3I3LQ/-_1q4ZkIfdUXd_EZIUAqA8VgvNzSkEJrFipFgA/_1I6ruNDSwsLQwMTACAA/7549160c-558f-4448-9f2c-e601beb29eba.jpeg'
    ]
  ),
  (
    'Bedsitter near campus', 'Madaraka', 'Nairobi', -1.3095, 36.8172,
    12000, 1, 1,
    'Affordable bedsitter, walking distance to campus, ideal for students.',
    array[
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFwrwtPXqTf6STMzLaqWV6SaMv2k5oR-Ma0YNJpI7XtQ&s=10'
    ]
  ),
  (
    '3 Bedroom Townhouse', 'Ruaka', 'Kiambu', -1.2129, 36.7815,
    65000, 3, 3,
    'Spacious townhouse with a small garden, gated compound, 24hr security.',
    array[
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStG64r8PxvLoSqVl5WhIIYHKvij4V6bgfCQ9m9Jy3Q7Q&s'
    ]
  ),
  (
    'Studio Apartment', 'Westlands', 'Nairobi', -1.2673, 36.8062,
    30000, 1, 1,
    'Modern studio in a serviced building, close to malls and offices.',
    array[
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgTnKxNNhNrnw0XMksIhyUVT5wbwjnPai8mYcHFd8tMQ&s=10'
    ]
  ),
  (
    '4 Bedroom Maisonette', 'Karen', 'Nairobi', -1.3192, 36.7076,
    120000, 4, 4,
    'Family maisonette with large compound, DSQ, and mature trees.',
    array[
      'https://www.dunhillconsulting.com/wp-content/uploads/2023/05/RFP_1761.jpg'
    ]
  ),
  (
    '1 Bedroom Apartment', 'Kileleshwa', 'Nairobi', -1.2833, 36.7833,
    38000, 1, 1,
    'Cozy 1-bedroom in a quiet, leafy neighbourhood, close to Kileleshwa shops.',
    array[
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ]
  );
