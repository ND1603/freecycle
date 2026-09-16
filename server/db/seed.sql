-- Optional: run after schema.sql for a demo login and a couple of items.
-- Demo login: demo@example.com / demo1234

INSERT INTO users (name, email, password_hash)
VALUES ('Demo Donor', 'demo@example.com', '$2a$10$I0WNvUHj71gMR2YWsTvoU.2UbuthL0tUWCZzHecdoTGeEoegkPhLm')
ON CONFLICT (email) DO NOTHING;

INSERT INTO items (title, description, category, condition, location, image_url, donor_id)
SELECT
  'Wooden bookshelf',
  'Five shelves, solid and sturdy. Selling my apartment is smaller now, doesn''t fit.',
  'Furniture', 'Good', 'Downtown',
  'https://picsum.photos/seed/bookshelf/640/480',
  id
FROM users WHERE email = 'demo@example.com';
