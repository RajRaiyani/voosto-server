import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from '@/service/database/index.js';
import { createConversation } from '@/modules/conversation/conversation.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readCsvFile(filePath: string) {
  return new Promise<any[]>((resolve) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results));
  });
}

function convertTo24Hour(time: string): string {
  if (!time) return '';

  const [rawTime, periodRaw] = time.split(' ');
  if (!rawTime || !periodRaw) return time;

  const period = periodRaw.toUpperCase();
  const [hourStr, minuteStr] = rawTime.split(':');

  let hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time;
  }

  if (period === 'AM') {
    if (hour === 12) hour = 0;
  } else if (period === 'PM') {
    if (hour !== 12) hour += 12;
  }

  const hourPadded = hour.toString().padStart(2, '0');
  const minutePadded = minute.toString().padStart(2, '0');

  return `${hourPadded}:${minutePadded}:00`;
}

async function uploadActivities() {
  let activities = await readCsvFile(path.join(__dirname, '../../tmp/activityData.csv'));

  activities = activities.map((activity) => {
    const [month, day, year] = activity.date.split('/');

    return {
      description: activity.description,
      category_name: activity.category,
      latitude: Number(activity.latitude),
      longitude: Number(activity.longitude),
      date: `${year}-${month}-${day}`,
      time: convertTo24Hour(activity.time),
      created_by_email: activity.created_by,
      is_private: activity.is_private === 'TRUE',
      is_womans_only: activity.is_women_only === 'TRUE',
    };
  });

  console.log(`Preparing to upload ${activities.length} activities`);

  const db = await Database.getConnection();

  try {
    for (const activity of activities) {
      try {
        await db.begin();
        const requestor = await db.queryOne(
          'SELECT id, gender FROM users WHERE email = $1',
          [activity.created_by_email]
        );

        if (!requestor) {
          console.error(`Skipping activity "${activity.description}" - user not found: ${activity.created_by_email}`);
          continue;
        }

        if (
          (requestor.gender === 'male' || requestor.gender === 'other') &&
          activity.is_womans_only
        ) {
          console.error(
            `Skipping activity "${activity.description}" - male/other user cannot create womans only activity`
          );
          continue;
        }

        const category = await db.queryOne(
          'SELECT id, icon FROM activity_categories WHERE LOWER(name) = LOWER($1) or name = $2',
          [activity.category_name, 'Good Vibes']
        );

        if (!category) {
          console.error(
            `Skipping activity "${activity.description}" - category not found: ${activity.category_name}`
          );
          continue;
        }

        const conversation = await createConversation(db, {
          name: activity.description.slice(0, 200),
          is_group: true,
          is_private: activity.is_private,
          is_womans_only: activity.is_womans_only,
          members: [
            {
              id: requestor.id,
              is_admin: true,
              notification_enabled: true,
            },
          ],
        });

        const createdActivity = await db.queryOne(
          `
            INSERT INTO activities (
              description,
              category_id,
              latitude,
              longitude,
              date,
              time,
              created_by,
              conversation_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `,
          [
            activity.description,
            category.id,
            activity.latitude,
            activity.longitude,
            activity.date,
            activity.time || null,
            requestor.id,
            conversation.id,
          ]
        );

        await db.query(
          `
            UPDATE conversations SET display_emoji = (
              SELECT icon FROM activity_categories WHERE id = $1
            ) WHERE id = $2
          `,
          [category.id, createdActivity.conversation_id]
        );
        await db.commit();

        console.log(`Uploaded activity: "${activity.description}" for ${activity.created_by_email}`);
      } catch (error: any) {
        console.error(
          `Failed to upload activity "${activity.description}" for ${activity.created_by_email}:`,
          error?.message || error
        );
      }
    }
  } finally {
    db.release();
  }
}

uploadActivities();