import { DatabaseClient } from '@/service/database/index.js';
import ServerError from '@/utils/serverError.js';



export async function getConversationMembership(
  db: DatabaseClient,
  conversationId: string,
  userId: string
): Promise<{ user_id: string, is_admin: boolean, notification_enabled: boolean }> {
  return await db.queryOne(`
    SELECT user_id, is_admin, notification_enabled FROM conversation_members
    WHERE conversation_id = $1 AND user_id = $2
  `, [conversationId, userId]);
}

export async function isMemberOfConversation(
  db: DatabaseClient,
  conversationId: string,
  userId: string
): Promise<boolean> {

  const memberShip = await getConversationMembership(db, conversationId, userId);

  return memberShip ? true : false;
}

/**
 * Check if user is a member of the conversation. Throws FORBIDDEN if not.
 */
export async function ensureMember(
  db: DatabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {

  const isMember = await isMemberOfConversation(db, conversationId, userId);

  if (!isMember) throw new ServerError('FORBIDDEN', 'You are not a member of this conversation');
}

interface Conversation {
  id: string;
  name: string;
  is_group: boolean;
  is_private: boolean;
  is_womans_only: boolean;
  created_at: Date;
  display_picture_url: string | null;
}


export async function getConversationById(
  db: DatabaseClient,
  conversationId: string,
  requestUserId: string
): Promise<Conversation | null> {


  const existingConversation = await db.queryOne(`
      SELECT is_group FROM conversations WHERE id = $1
    `, [conversationId]);

  if (!existingConversation) return null;

  const memberShip = await getConversationMembership(db, conversationId, requestUserId);

  const isMember = memberShip ? true : false;
  const notificationEnabled = memberShip?.notification_enabled ?? true;

  if (existingConversation.is_group) {
    const sqlQuery = `
      SELECT 
        c.id,
        c.name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
        c.created_at,
        $2 AS is_member,
        $3 AS notification_enabled,
        CASE WHEN f.id IS NOT NULL THEN f.url ELSE NULL END AS display_picture_url
      FROM conversations c
      LEFT JOIN files f ON f.id = c.display_picture_id
      WHERE c.id = $1
    `;
    return await db.queryOne(sqlQuery, [conversationId, isMember, notificationEnabled]);
  } else {
    const sqlQuery = `
      SELECT 
        c.id,
        c.name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
        c.created_at,
        $3 AS is_member,
        $4 AS notification_enabled,
        CASE WHEN f.id IS NOT NULL THEN f.url ELSE NULL END AS display_picture_url
      FROM conversations c
      LEFT JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id != $2
      LEFT JOIN users u ON u.id = cm.user_id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE c.id = $1
    `;
    return await db.queryOne(sqlQuery, [conversationId, requestUserId, isMember, notificationEnabled]);
  }

}

export type NewMessagePayload = {
  id: string;
  conversation_id: string;
  content: string;
  created_at: Date;
  seen_at: null | Date;
  sender: {
    id: string;
    full_name: string;
  };
  attachments: {
    id: string;
    url: string;
  }[];
};


export async function getMessageById(db: DatabaseClient, messageId: string): Promise<NewMessagePayload> {
  return await db.queryOne(`
    SELECT 
      m.id, 
      m.conversation_id, 
      m.content, 
      m.created_at, 
      m.seen_at,

      json_build_object(
        'id', u.id,
        'full_name', u.full_name
      ) AS sender,

      COALESCE(
        json_agg(
          json_build_object(
            'id', f.id,
            'url', f.url
          )
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'::json
      ) AS attachments

    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    LEFT JOIN message_attachments ma ON ma.message_id = m.id
    LEFT JOIN files f ON f.id = ma.file_id
    GROUP BY m.id, u.id
    HAVING m.id = $1
  `, [messageId]);
}


/**
 * Create a message in a conversation. Caller must ensure user is participant.
 * Throws ERROR if content invalid.
 */
interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
  attachments: string[];
}
export async function createMessage(
  db: DatabaseClient,
  { conversationId, senderId, content, attachments = [] }: CreateMessageInput
): Promise<NewMessagePayload> {

  if (attachments.length && (!content || content.trim().length === 0)) throw new ServerError('ERROR', 'Message content is required');

  try{
    await db.begin();

    const message = await db.queryOne(`
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES ($1, $2, $3)
    RETURNING id, conversation_id, sender_id, content, created_at, seen_at
  `,
    [conversationId, senderId, content?.trim()]
    );

    for (const attachment of attachments) {
      await db.query(`
      INSERT INTO message_attachments (message_id, file_id)
      VALUES ($1, $2)
    `, [message.id, attachment]);
    }

    await db.commit();

    return await getMessageById(db, message.id);
    
  } catch (error) {
    await db.rollback();
    throw error;
  }
}



interface listConversationMessagesQuery {
  offset: number;
  limit: number;
  search?: string;
}

export async function listConversationMessages(db: DatabaseClient, conversationId: string, { offset=0, limit=100, search=null }: listConversationMessagesQuery): Promise<NewMessagePayload[]> {

  const values = [conversationId, offset, limit];

  let whereClause = ' m.conversation_id = $1 ';

  if (search){
    values.push(`%${search}%`);
    whereClause += ` AND LOWER(m.content) ILIKE LOWER($${values.length}) `;
  }

  const messages = await db.queryAll(`
    SELECT 
      m.id, 
      m.conversation_id, 
      m.content, 
      m.created_at, 
      m.seen_at,

      json_build_object(
        'id', u.id,
        'full_name', u.full_name
      ) AS sender,

      COALESCE(array_agg(json_build_object(
        'id', f.id,
        'url', f.url
      )) FILTER (WHERE f.id IS NOT NULL), '{}'::json[]) AS attachments

    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    LEFT JOIN message_attachments ma ON ma.message_id = m.id
    LEFT JOIN files f ON f.id = ma.file_id
    WHERE ${whereClause}
    GROUP BY m.id, u.id
    ORDER BY m.created_at DESC
    OFFSET $2 LIMIT $3
  `, values);

  return messages;
}


export async function getPersonalConversation(db: DatabaseClient, userId: string, otherUserId: string): Promise<Conversation | null> {
  const conversation = await db.queryOne(`
    SELECT c.id
    FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE 
      c.is_group = false AND 
      cm.user_id IN ($1, $2)
    GROUP BY c.id
    HAVING COUNT(*) = 2;
`, [userId, otherUserId]);

  return conversation;
}


interface CreateConversationInput {
  name?:string
  is_group: boolean
  is_private: boolean
  is_womans_only: boolean
  members: {
    id: string;
    is_admin: boolean;
    notification_enabled: boolean;
  }[];
}

export async function createConversation(db: DatabaseClient,  
  { name, is_group = false, is_private = false, is_womans_only = false, members =[] }:CreateConversationInput){
  
  if (is_group) {
    if (!name || name.trim().length === 0) throw new ServerError('ERROR', 'Group conversation must have a name');
    if (members.length === 0) throw new ServerError('ERROR', 'Group conversation must have at least one participant');
    if ([...new Set(members.map(p => p.id))].length !== members.length) throw new ServerError('ERROR', 'Duplicate participants');
    if (!members.some(p => p.is_admin)) throw new ServerError('ERROR', 'At least one participant must be an admin');
  } else {
    if (members.length !== 2) throw new ServerError('ERROR', 'Direct conversation must have exactly two participants');
    if (members[0].id === members[1].id) throw new ServerError('ERROR', 'You cannot create a conversation with yourself');
    
    const existingConversation = await getPersonalConversation(db, members[0].id, members[1].id);

    if (existingConversation) return existingConversation;
  }

  try{
    await db.begin();

    const conversation = await db.queryOne(`
      INSERT INTO conversations (name, is_group, is_private, is_womans_only) VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [name, is_group, is_private, is_womans_only]);


    for (const participant of members) {
      await db.query(`
        INSERT INTO conversation_members (conversation_id, user_id, is_admin, notification_enabled)
        VALUES ($1, $2, $3, $4)
      `, [conversation.id, participant.id, participant.is_admin, participant.notification_enabled ?? true]);
    }

    await db.commit();

    return conversation;
  } catch (error) {
    await db.rollback();
    throw error;
  }
}


export async function addMemberToConversation(db: DatabaseClient, conversationId: string, userId: string, isAdmin: boolean = false): Promise<void> {

  const member = await db.queryOne(`
      INSERT INTO conversation_members (conversation_id, user_id, is_admin)
      VALUES ($1, $2, $3)
      RETURNING conversation_id, user_id, is_admin
    `, [conversationId, userId, isAdmin]);

  return member;
}


export async function createJoiningRequest(db: DatabaseClient, conversationId: string, userId: string): Promise<void> {
  const joiningRequest = await db.queryOne(`
    INSERT INTO conversation_joining_requests (conversation_id, user_id)
    VALUES ($1, $2)
    RETURNING conversation_id, user_id
  `, [conversationId, userId]);

  return joiningRequest;
}

export async function isAdminOfConversation(db: DatabaseClient, conversationId: string, userId: string): Promise<boolean> {
  const admin = await db.queryOne(`
    SELECT is_admin FROM conversation_members WHERE conversation_id = $1 AND user_id = $2
  `, [conversationId, userId]);

  if (!admin) return false;

  return admin.is_admin;
}

export async function removeMemberFromConversation(db: DatabaseClient, conversationId: string, userId: string): Promise<void> {
  const member = await db.queryOne(`
    DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2
    RETURNING conversation_id, user_id, is_admin
  `, [conversationId, userId]);

  return member;
}

