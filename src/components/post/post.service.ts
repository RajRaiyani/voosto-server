import { DatabaseClient } from '@/service/database/index.js';

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

export async function GetPostById(db: DatabaseClient, post_id: string): Promise<{
  id: string;
  title: string;
  file: {id: string; key: string; url: string; size: number; mimetype: string; created_at: string};
  user: {id: string; first_name: string; last_name: string; full_name: string; email: string; profile_image_url: string};
} | null> {
  const post = await db.queryOne(
    `
    SELECT 
      up.id,
      up.user_id,
      up.title,
      CASE WHEN f.id IS NOT NULL THEN
        json_build_object(
          'id', f.id,
          'key', f.key,
          'url', f.url,
          'size', f.size,
          'mimetype', f.mimetype,
          'created_at', f.created_at
        )
      ELSE NULL END as file,

      CASE WHEN u.id IS NOT NULL THEN
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'full_name', u.full_name,
          'email', u.email,
          'profile_image_url', CASE WHEN pf.id IS NOT NULL THEN pf.url ELSE NULL END
        )
      ELSE NULL END as user
      
    FROM user_posts up
    LEFT JOIN files f ON f.id = up.file_id
    LEFT JOIN users u ON u.id = up.user_id
    LEFT JOIN files pf ON pf.id = u.profile_image_id
    WHERE up.id = $1
    `,
    [post_id]
  );
  return post;
}


export async function ListUserPosts(db: DatabaseClient, user_id: string) {
  const posts = await db.queryAll(
    `
    SELECT 
      up.id,
      up.user_id,
      up.title,
      CASE WHEN f.id IS NOT NULL THEN
        json_build_object(
          'id', f.id,
          'key', f.key,
          'url', f.url,
          'size', f.size,
          'mimetype', f.mimetype,
          'created_at', f.created_at
        )
      ELSE NULL END as file,

      CASE WHEN u.id IS NOT NULL THEN
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'full_name', u.full_name,
          'email', u.email,
          'profile_image_url', CASE WHEN pf.id IS NOT NULL THEN pf.url ELSE NULL END
        )
      ELSE NULL END as user
      
    FROM user_posts up
    LEFT JOIN files f ON f.id = up.file_id
    LEFT JOIN users u ON u.id = up.user_id
    LEFT JOIN files pf ON pf.id = u.profile_image_id
    WHERE up.user_id = $1
    ORDER BY f.created_at DESC
    `,
    [user_id]
  );
  return posts;
}