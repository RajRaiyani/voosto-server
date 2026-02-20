import ServerEvent, { EventContext, EventContextProvider } from '@/service/event/index.js';
import { createNotification } from '@/components/notification/notification.service.js';
import RedisClient from '@/service/redis/index.js';


async function onNewActivityCreatedHandler({ db }: EventContext, activityId: string) : Promise<void> {

  const activity = await db.queryOne(`
    SELECT
      a.id,
      a.description,
      a.category,
      a.latitude,
      a.longitude,
      json_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url
      ) as created_by

    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE a.id = $1
    `, [activityId]);

  if (!activity) return;

  const nearestUsers = await RedisClient.geoSearch('geo:user', {
    longitude: activity.longitude,
    latitude: activity.latitude,
  }, {
    radius: 25,
    unit: 'km',
  }) as string[];

  for (const userId of nearestUsers) {
    await createNotification(db, {
      user_id: userId,
      type: 'new_activity_created',
      message: `New activity created near you by ${activity.created_by.full_name}.`,
      meta_data: {
        activity_id: activity.id,
        description: activity.description,
        category: activity.category,
        created_by: activity.created_by,
      },
    });
  }

}

ServerEvent.on('activity:created', EventContextProvider(onNewActivityCreatedHandler, { withDatabase: true }));