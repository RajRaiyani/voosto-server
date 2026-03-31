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
      ac.icon as category_icon,
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

  const conversation = await db.queryOne(`
    SELECT id, is_womans_only FROM conversations WHERE id = $1
  `, [activity.conversation_id]);

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
      (settings->'notify_near_by_activities' is null or settings @> '{"notify_near_by_activities": true}') AND
      ($3 = false OR users.gender = 'female')
  `, [nearestUsers, activity.created_by.id, conversation.is_womans_only]);

  await createNotifications(db, usersToNotify.map(user => user.id), {
    type: 'new_activity',
    title: `${activity.created_by.full_name} posted a new activity.`,
    activity_id: activity.id,
    description: activity.description,
    category: activity.category,
    category_icon: activity.category_icon,
    created_by: activity.created_by.full_name,
    profile_image_url: activity.created_by.profile_image_url,
    conversation_id: activity.conversation_id,
  }, {
    database: true,
    socket: true,
    pushNotifications: true,
  });
  
}

ServerEvent.on('activity:created', RegisterServerEventHandler(onNewActivityCreatedHandler, { withDatabase: true }));