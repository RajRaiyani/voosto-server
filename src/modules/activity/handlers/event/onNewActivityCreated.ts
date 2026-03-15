import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';
import { createNotifications } from '@/modules/notification/notification.service.js';
import RedisClient from '@/service/redis/index.js';


async function onNewActivityCreatedHandler({ database:db }: Context, activityId: string) {

  const activity = await db.queryOne(`
    SELECT
      a.id,
      a.description,
      ac.name as category,
      a.latitude,
      a.longitude,
      a.conversation_id,
      json_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url
      ) as created_by

    FROM activities a
    LEFT JOIN activity_categories ac ON ac.id = a.category_id
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE a.id = $1
    `, [activityId]);

  if (!activity) return;

  const nearestUsers = await RedisClient.geoSearch('geo:user', {
    longitude: activity.longitude,
    latitude: activity.latitude,
  }, {
    radius: 30,
    unit: 'km',
  }) as string[];

  const usersToNotify = await db.queryAll<{ id: string }>(`
    SELECT id FROM users
    WHERE 
      id = ANY($1) AND
      id != $2 AND
      settings @> '{"notify_near_by_activities": true}'
  `, [nearestUsers, activity.created_by.id]);

  await createNotifications(db, usersToNotify.map(user => user.id), {
    type: 'new_activity',
    title: 'New activity created near you.',
    body: `New activity created near you by ${activity.created_by.full_name}.`,
    activity_id: activity.id,
    description: activity.description,
    category: activity.category,
    created_by: activity.created_by,
    conversation_id: activity.conversation_id,
  });
  
}

ServerEvent.on('activity:created', RegisterServerEventHandler(onNewActivityCreatedHandler, { withDatabase: true }));