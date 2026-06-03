import { fileURLToPath } from 'url';
import Database from '@/service/database/index.js';
import Logger from '@/service/logger/index.js';

const TIMEZONE = 'Asia/Kolkata';

export async function task() {
  const db = await Database.getConnection();

  try {
    const result = await db.query(
      `
      UPDATE activities a
      SET date = (CURRENT_TIMESTAMP AT TIME ZONE $1)::date + (floor(random() * 5) + 1)::integer
      FROM users u
      WHERE a.created_by = u.id
        AND u.is_fake_user = true
        AND a.date = (CURRENT_TIMESTAMP AT TIME ZONE $1)::date
      RETURNING a.id
      `,
      [TIMEZONE]
    );

    Logger.info(
      `Extended activity dates for ${result.rowCount ?? 0} fake-user activities scheduled for today (${TIMEZONE})`
    );
  } finally {
    db.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  task().catch((err) => {
    Logger.error('Extend fake user activity dates failed', err);
    process.exit(1);
  });
}
