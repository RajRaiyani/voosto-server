-- migrate:up

DO $$
DECLARE
  deleted_user RECORD;
BEGIN
  FOR deleted_user IN
    SELECT id FROM users WHERE is_deleted = true
  LOOP
    DELETE FROM friend_mappings WHERE sender_id = deleted_user.id OR receiver_id = deleted_user.id;
    DELETE FROM conversation_joining_requests WHERE user_id = deleted_user.id;
    DELETE FROM notifications WHERE user_id = deleted_user.id;
    DELETE FROM conversation_members WHERE user_id = deleted_user.id;
    DELETE FROM activities WHERE created_by = deleted_user.id;
    DELETE FROM user_notification_tokens WHERE user_id = deleted_user.id;
    DELETE FROM user_posts WHERE user_id = deleted_user.id;
    DELETE FROM user_interested_activities WHERE user_id = deleted_user.id;
    DELETE FROM visited_countries WHERE user_id = deleted_user.id;
    DELETE FROM report_inquiries WHERE created_by = deleted_user.id;
    DELETE FROM trips WHERE created_by = deleted_user.id;
    DELETE FROM blocked_users WHERE blocker_id = deleted_user.id OR blocked_id = deleted_user.id;
    DELETE FROM message_attachments where message_id in (select id from messages where sender_id = deleted_user.id);
    DELETE FROM messages WHERE sender_id = deleted_user.id;
    DELETE FROM users where id = deleted_user.id;
  END LOOP;
END $$;


insert into activity_categories (name, icon) values
('All The Vibes', '🌐'),
('Foodie Runs', '🍜'),
('Squad Hangouts', '🪩'),
('Move Mode', '⚡'),
('Show Time', '🎭'),
('Explore Mode', '🧭'),
('Level Up', '🚀'),
('Game Zone', '🕹️'),
('Creator Space', '🧩'),
('Good Vibes', '🌱'),
('Slow Moments', '🌇'),
('Wild Plans', '🎲');




-- migrate:down

