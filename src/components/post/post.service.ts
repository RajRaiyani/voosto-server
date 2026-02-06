import { DatabaseClient } from '@/service/database/index.js';
import Env from '@/config/env.js';

export async function CreatePost(
  db: DatabaseClient,
  { user_id, title, file_id }: { user_id: string; title: string; file_id: string }
) {
  const post = await db.queryOne(
    `
    INSERT INTO user_posts (user_id, title, file_id)
    VALUES ($1, $2, $3)
    RETURNING 
      id, 
      user_id, 
      title, 
      file_id,
      meta_data
    `,
    [user_id, title, file_id]
  );
  return post;
}

export async function GetPostById(db: DatabaseClient, post_id: string) {
  const post = await db.queryOne(
    `
    SELECT 
      up.id,
      up.user_id,
      up.title,
      up.file_id,
      up.meta_data,
      
      CASE WHEN f.id IS NOT NULL THEN ($1 || '/' || f.key) ELSE NULL END as file_url,
      f.size as file_size,
      f.mimetype as file_mimetype,
      f._status as file_status,
      f.created_at as file_created_at,
      
      u.first_name,
      u.last_name,
      u.email,
      
      CASE WHEN pf.id IS NOT NULL THEN ($1 || '/' || pf.key) ELSE NULL END as user_profile_image_url
      
    FROM user_posts up
    INNER JOIN files f ON f.id = up.file_id
    INNER JOIN users u ON u.id = up.user_id
    LEFT JOIN files pf ON pf.id = u.profile_image_id
    WHERE up.id = $2
    `,
    [Env.fileStorageEndpoint, post_id]
  );
  return post;
}

export async function DeletePost(
  db: DatabaseClient,
  post_id: string,
  user_id: string
) {
  const post = await db.queryOne(
    `
    SELECT up.id, up.user_id, up.file_id, f.key as file_key
    FROM user_posts up
    INNER JOIN files f ON f.id = up.file_id
    WHERE up.id = $1
    `,
    [post_id]
  );

  if (!post) return null;
  if (post.user_id !== user_id) return null;

  return post;
}

export async function ListUserPosts(db: DatabaseClient, user_id: string) {
  const posts = await db.queryAll(
    `
    SELECT 
      up.id,
      up.user_id,
      up.title,
      up.file_id,
      up.meta_data,
      
      CASE WHEN f.id IS NOT NULL THEN ($1 || '/' || f.key) ELSE NULL END as file_url,
      f.size as file_size,
      f.mimetype as file_mimetype,
      f._status as file_status,
      f.created_at as created_at
      
    FROM user_posts up
    INNER JOIN files f ON f.id = up.file_id
    WHERE up.user_id = $2
    ORDER BY f.created_at DESC
    `,
    [Env.fileStorageEndpoint, user_id]
  );
  return posts;
}