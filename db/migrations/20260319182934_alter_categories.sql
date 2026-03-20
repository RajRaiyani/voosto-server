-- migrate:up

alter table activity_categories add column description text;

insert into activity_categories (name, icon, description) values
('All The Vibes', '🌐', 'Everything happening around you.'),
('Foodie Runs', '🍜', 'Coffee, dinner, cafés, street food.'),
('Squad Hangouts', '🪩', 'Meetups, chilling, making friends.'),
('Move Mode', '⚡', 'Gym, running, sports, cycling.'),
('Show Time', '🎭', 'Movies, concerts, comedy, performances.'),
('Explore Mode', '🧭', 'Trips, road trips, discovering places.'),
('Level Up', '🚀', 'Learning, workshops, skill building.'),
('Game Zone', '🕹️', 'Video games, board games.'),
('Creator Space', '🧩', 'Photography, art, music, content.'),
('Good Vibes', '🌱', 'Community, volunteering, meetups.'),
('Slow Moments', '🌇', 'Walks, sunsets, relaxing.'),
('Wild Plans', '🎲', 'Random or spontaneous activities.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- migrate:down

