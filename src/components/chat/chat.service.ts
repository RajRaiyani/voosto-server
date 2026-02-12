import { DatabaseClient } from '@/service/database/index.js';
import ServerError from '@/utils/serverError.js';
import Env from '@/config/env.js';

const MESSAGE_CONTENT_MAX = 10000;

/**
 * Check if user is a participant of the conversation. Throws FORBIDDEN if not.
 */
export async function ensureParticipant(
  db: DatabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {

  const participant = await db.namedQueryOne<{ user_id: string }>(`
    SELECT user_id FROM conversation_participants
    WHERE conversation_id = $conversation_id AND user_id = $user_id
  `,
  { conversation_id: conversationId, user_id: userId }
  );

  if (!participant) {
    throw new ServerError('FORBIDDEN', 'You are not a participant of this conversation');
  }
}

/**
 * Get conversation by id. Returns null if not found.
 */
export async function getConversationById(
  db: DatabaseClient,
  conversationId: string
): Promise<{ id: string; name: string; is_group: boolean; created_at: Date; created_by: string } | null> {
  return db.namedQueryOne(
    `SELECT id, name, is_group, created_at, created_by
     FROM conversations WHERE id = $conversation_id`,
    { conversation_id: conversationId }
  );
}

export type NewMessagePayload = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: Date;
  seen_at: null | Date;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    profile_image_url: string | null;
  };
};

/**
 * Create a message in a conversation. Caller must ensure user is participant.
 * Throws ERROR if content invalid.
 */
export async function createMessage(
  db: DatabaseClient,
  conversationId: string,
  userId: string,
  content: string
): Promise<NewMessagePayload> {
  const trimmed = (content ?? '').trim();
  if (!trimmed.length) throw new ServerError('ERROR', 'Message content is required');
  if (trimmed.length > MESSAGE_CONTENT_MAX) {
    throw new ServerError('ERROR', 'Message must be less than 10000 characters');
  }

  const message = await db.namedQueryOne(
    `INSERT INTO messages (conversation_id, sender_id, content)
     VALUES ($conversation_id, $sender_id, $content)
     RETURNING id, conversation_id, sender_id, content, created_at, seen_at`,
    { conversation_id: conversationId, sender_id: userId, content: trimmed }
  );

  await db.query('UPDATE conversations SET updated_at = now() WHERE id = $1', [conversationId]);

  const sender = await db.namedQueryOne(
    `SELECT u.id, u.first_name, u.last_name, u.full_name,
            CASE WHEN f.id IS NOT NULL THEN (CONCAT($file_endpoint, '/', f.key)) ELSE NULL END AS profile_image_url
     FROM users u
     LEFT JOIN files f ON f.id = u.profile_image_id
     WHERE u.id = $user_id`,
    { file_endpoint: Env.fileStorageEndpoint, user_id: userId }
  );

  return { ...message!, sender: sender! };
}

/**
 * Mark all messages in the conversation (from others) as seen. Caller must ensure user is participant.
 */
export async function markConversationSeen(
  db: DatabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {
  await db.query(
    `UPDATE messages SET seen_at = now()
     WHERE conversation_id = $1 AND sender_id != $2 AND seen_at IS NULL`,
    [conversationId, userId]
  );
}


export async function createNewGroupConversation(db: DatabaseClient, { name, adminId }:{name:string, adminId:string}){

  const conversation = await db.queryOne(`
      INSERT INTO conversations (name, is_group)
      VALUES ($1, $2)
      RETURNING id, name, is_group, created_at
    `, [name, true]);

  await db.query(`
      INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
      VALUES ($1, $2, $3)
    `, [conversation.id, adminId, true]);

  return conversation;
}

export async function createConversation(db: DatabaseClient,  { user_1_id, user_2_id }:{user_1_id:string, user_2_id:string}){

  if (user_1_id === user_2_id) throw new ServerError('ERROR', 'You cannot create a conversation with yourself');

  const conversation = await db.queryOne(`
        SELECT c.id
        FROM conversations c
        JOIN conversation_participants cp ON cp.conversation_id = c.id
        WHERE c.is_group = false
          AND cp.user_id IN ($user1_id, $user2_id)
        GROUP BY c.id
        HAVING COUNT(*) = 2;
    `, [user_1_id, user_2_id]);

  if (conversation) return conversation;

  try{
    await db.begin();

    const conversation = await db.queryOne(`
      INSERT INTO conversations () VALUES ()
      RETURNING id
    `, [user_1_id]);

    await db.query(`
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES ($1, $2)
    `, [conversation.id, user_1_id]);

    await db.query(`
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES ($1, $2)
    `, [conversation.id, user_2_id]);

    await db.commit();

    return conversation;
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
