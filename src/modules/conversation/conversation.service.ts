import { DatabaseClient } from '@/service/database/index.js';
import ServerError from '@/utils/serverError.js';
import { createNotifications } from '@/modules/notification/notification.service.js';
import ServerEvent from '@/service/event/index.js';
import Socket from '@/socket.js';


export * from '@/modules/conversation/services/conversationJoin.service.js';
export * from '@/modules/conversation/services/conversationOperation.service.js';

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
  display_emoji: string;
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
        c.place_id,
        c.created_at,
        c.display_emoji,
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
        u.full_name as name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
        c.place_id,
        c.created_at,
        c.display_emoji,
        $3 AS is_member,
        $4 AS notification_enabled, 
        CASE WHEN f.id IS NOT NULL THEN f.url ELSE NULL END AS display_picture_url,
        ct.flag as country_flag
      FROM conversations c
      LEFT JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id != $2
      LEFT JOIN users u ON u.id = cm.user_id AND u.is_deleted = false
      LEFT JOIN countries ct ON ct.id = u.country_id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE c.id = $1
    `;
    return await db.queryOne(sqlQuery, [conversationId, requestUserId, isMember, notificationEnabled]);
  }

}

export type MessageSenderPayload = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
};

export type MessageReactionUserPayload = {
  user_id: string;
  full_name: string;
  profile_image_url: string | null;
  created_at: Date;
};

export type MessageReactionGroupPayload = {
  emoji: string;
  users: MessageReactionUserPayload[];
};

export type MessageReplyPreviewPayload = {
  id: string;
  content: string;
  created_at: Date;
  sender: MessageSenderPayload | null;
};

export type NewMessagePayload = {
  id: string;
  conversation_id: string;
  content: string;
  created_at: Date;
  sender: MessageSenderPayload | null;
  attachments: {
    id: string;
    url: string;
  }[];
  reply_to: MessageReplyPreviewPayload | null;
  reactions: MessageReactionGroupPayload[];
};



interface CreateMessageInput {
  conversationId: string;
  senderId?: string | null | undefined;
  content: string;
  attachments?: string[];
  replyToMessageId?: string | null;
}

async function validateReplyToMessage(
  db: DatabaseClient,
  conversationId: string,
  replyToMessageId: string,
): Promise<void> {
  const replyMessage = await db.queryOne<{ id: string; conversation_id: string }>(`
    SELECT id, conversation_id FROM messages WHERE id = $1
  `, [replyToMessageId]);

  if (!replyMessage) throw new ServerError('NOT_FOUND', 'Reply message not found');
  if (replyMessage.conversation_id !== conversationId) {
    throw new ServerError('ERROR', 'Reply message must be in the same conversation');
  }
}

function buildMessageSenderJsonSql(
  userAlias: string,
  fileAlias: string,
  block1Alias: string,
  block2Alias: string,
) {
  return `
    CASE WHEN ${userAlias}.id IS NOT NULL THEN json_build_object(
      'id', ${userAlias}.id,
      'full_name',
        CASE
          WHEN ${block1Alias}.blocker_id IS NOT NULL OR ${block2Alias}.blocker_id IS NOT NULL THEN 'Voosto User'
          ELSE ${userAlias}.full_name
        END,
      'profile_image_url',
        CASE
          WHEN ${block1Alias}.blocker_id IS NOT NULL OR ${block2Alias}.blocker_id IS NOT NULL THEN 'https://voosto.com/assets/logos/favicon.png'
          ELSE ${fileAlias}.url
        END
    ) ELSE NULL END
  `;
}

const messageSenderJsonSql = buildMessageSenderJsonSql('u', 'uf', 'b1', 'b2');
const messageReplySenderJsonSql = buildMessageSenderJsonSql('rmu', 'rmuf', 'rmb1', 'rmb2');

const messageReactionsJsonSql = (viewerParam: string) => `
  COALESCE((
    SELECT json_agg(
      json_build_object('emoji', grouped.emoji, 'users', grouped.users)
      ORDER BY grouped.emoji
    )
    FROM (
      SELECT
        mr.emoji,
        json_agg(
          json_build_object(
            'user_id', rxu.id,
            'full_name',
              CASE
                WHEN rxb1.blocker_id IS NOT NULL OR rxb2.blocker_id IS NOT NULL THEN 'Voosto User'
                ELSE rxu.full_name
              END,
            'profile_image_url',
              CASE
                WHEN rxb1.blocker_id IS NOT NULL OR rxb2.blocker_id IS NOT NULL THEN 'https://voosto.com/assets/logos/favicon.png'
                ELSE rxf.url
              END,
            'created_at', mr.created_at
          )
          ORDER BY mr.created_at
        ) AS users
      FROM message_reactions mr
      JOIN users rxu ON rxu.id = mr.user_id
      LEFT JOIN files rxf ON rxf.id = rxu.profile_image_id
      LEFT JOIN blocked_users rxb1
        ON rxb1.blocker_id = ${viewerParam}
        AND rxb1.blocked_id = rxu.id
      LEFT JOIN blocked_users rxb2
        ON rxb2.blocker_id = rxu.id
        AND rxb2.blocked_id = ${viewerParam}
      WHERE mr.message_id = m.id
      GROUP BY mr.emoji
    ) grouped
  ), '[]'::json)
`;

const messageReplyToJsonSql = () => `
  CASE WHEN rm.id IS NOT NULL THEN json_build_object(
    'id', rm.id,
    'content', rm.content,
    'created_at', rm.created_at,
    'sender', ${messageReplySenderJsonSql}
  ) ELSE NULL END
`;

export async function getMessageById(
  db: DatabaseClient,
  messageId: string,
  viewerUserId: string | null,
): Promise<NewMessagePayload | null> {
  const viewerParam = viewerUserId ? '$2' : 'NULL::uuid';
  const values = viewerUserId ? [messageId, viewerUserId] : [messageId];

  return await db.queryOne(`
    SELECT
      m.id,
      m.conversation_id,
      m.content,
      m.created_at,
      ${messageSenderJsonSql} AS sender,
      COALESCE(array_agg(json_build_object(
        'id', f.id,
        'url', f.url
      )) FILTER (WHERE f.id IS NOT NULL), '{}'::json[]) AS attachments,
      ${messageReplyToJsonSql()} AS reply_to,
      ${messageReactionsJsonSql(viewerParam)} AS reactions
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    LEFT JOIN files uf ON uf.id = u.profile_image_id
    LEFT JOIN blocked_users b1
      ON b1.blocker_id = ${viewerParam}
      AND b1.blocked_id = u.id
    LEFT JOIN blocked_users b2
      ON b2.blocker_id = u.id
      AND b2.blocked_id = ${viewerParam}
    LEFT JOIN message_attachments ma ON ma.message_id = m.id
    LEFT JOIN files f ON f.id = ma.file_id
    LEFT JOIN messages rm ON rm.id = m.reply_to_message_id
    LEFT JOIN users rmu ON rmu.id = rm.sender_id
    LEFT JOIN files rmuf ON rmuf.id = rmu.profile_image_id
    LEFT JOIN blocked_users rmb1
      ON rmb1.blocker_id = ${viewerParam}
      AND rmb1.blocked_id = rmu.id
    LEFT JOIN blocked_users rmb2
      ON rmb2.blocker_id = rmu.id
      AND rmb2.blocked_id = ${viewerParam}
    WHERE m.id = $1
    GROUP BY m.id, u.id, uf.id, uf.url, b1.blocker_id, b2.blocker_id,
      rm.id, rm.content, rm.created_at, rmu.id, rmuf.id, rmuf.url, rmb1.blocker_id, rmb2.blocker_id
  `, values);
}

/**
 * Create a message in a conversation. Caller must ensure user is participant.
 * Throws ERROR if content invalid.
 */
export async function createMessage(
  db: DatabaseClient,
  { conversationId, senderId, content, attachments = [], replyToMessageId = null }: CreateMessageInput,
  transports: {
    pushNotifications?: boolean;
    socket?: boolean;
  } = {
    pushNotifications: true,
    socket: true,
  }
): Promise<NewMessagePayload> {

  if (!attachments.length && (!content || content.trim().length === 0)) {
    throw new ServerError('ERROR', 'Message content is required');
  }

  if (replyToMessageId) {
    await validateReplyToMessage(db, conversationId, replyToMessageId);
  }

  let messageId: string;

  try {
    await db.begin();

    const message = await db.queryOne<{ id: string }>(
      `
        INSERT INTO messages (conversation_id, sender_id, content, reply_to_message_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [conversationId, senderId, content?.trim(), replyToMessageId]
    );

    if (!message) throw new ServerError('ERROR', 'Failed to create message');

    messageId = message.id;

    for (const attachment of attachments) {
      await db.query(
        `
          INSERT INTO message_attachments (message_id, file_id)
          VALUES ($1, $2)
        `,
        [messageId, attachment]
      );
    }

    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  }

  if (transports.pushNotifications || transports.socket) {
    const users = await db.queryAll(
      'SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2 AND notification_enabled = true',
      [conversationId, senderId]
    );

    const sender = await db.queryOne(
      'SELECT full_name FROM users WHERE id = $1',
      [senderId]
    );

    await createNotifications(db, users.map(user => user.user_id), {
      type: 'new_message',
      title: `${sender?.full_name}`,
      body: content ? content : attachments.length > 0 ? '📷 Photo' : '',
      conversation_id: conversationId,
      message_id: messageId,
    }, {
      database: false,
      socket: transports.socket,
      pushNotifications: transports.pushNotifications,
    });
  }

  const createdMessage = await getMessageById(db, messageId, senderId ?? null);
  if (!createdMessage) throw new ServerError('ERROR', 'Failed to load created message');

  return createdMessage;
}

export async function getMessageReactions(
  db: DatabaseClient,
  messageId: string,
  viewerUserId: string,
): Promise<MessageReactionGroupPayload[]> {
  const message = await getMessageById(db, messageId, viewerUserId);
  return message?.reactions ?? [];
}

export async function listMessageReactions(
  db: DatabaseClient,
  conversationId: string,
  messageId: string,
  viewerUserId: string,
): Promise<MessageReactionGroupPayload[]> {
  await ensureMember(db, conversationId, viewerUserId);

  const message = await db.queryOne<{ id: string }>(`
    SELECT id FROM messages WHERE id = $1 AND conversation_id = $2
  `, [messageId, conversationId]);

  if (!message) throw new ServerError('NOT_FOUND', 'Message not found');

  return getMessageReactions(db, messageId, viewerUserId);
}

export async function toggleMessageReaction(
  db: DatabaseClient,
  messageId: string,
  userId: string,
  emoji: string,
): Promise<{ conversation_id: string; reactions: MessageReactionGroupPayload[] }> {
  const message = await db.queryOne<{ id: string; conversation_id: string }>(`
    SELECT id, conversation_id FROM messages WHERE id = $1
  `, [messageId]);

  if (!message) throw new ServerError('NOT_FOUND', 'Message not found');

  await ensureMember(db, message.conversation_id, userId);

  const existingReaction = await db.queryOne<{ emoji: string }>(`
    SELECT emoji FROM message_reactions WHERE message_id = $1 AND user_id = $2
  `, [messageId, userId]);

  if (existingReaction?.emoji === emoji) {
    await db.query('DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2', [messageId, userId]);
  } else if (existingReaction) {
    await db.query(
      'UPDATE message_reactions SET emoji = $1, created_at = now() WHERE message_id = $2 AND user_id = $3',
      [emoji, messageId, userId],
    );
  } else {
    await db.query(
      'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
      [messageId, userId, emoji],
    );
  }

  const reactions = await getMessageReactions(db, messageId, userId);

  return {
    conversation_id: message.conversation_id,
    reactions,
  };
}



interface listConversationMessagesQuery {
  offset: number;
  limit: number;
  search?: string;
}

export async function listConversationMessages(
  db: DatabaseClient,
  conversationId: string,
  userId: string,
  { offset=0, limit=100, search=null }: listConversationMessagesQuery
): Promise<NewMessagePayload[]> {

  const values = [conversationId, offset, limit, userId];

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
      ${messageSenderJsonSql} AS sender,
      COALESCE(array_agg(json_build_object(
        'id', f.id,
        'url', f.url
      )) FILTER (WHERE f.id IS NOT NULL), '{}'::json[]) AS attachments,
      ${messageReplyToJsonSql()} AS reply_to,
      ${messageReactionsJsonSql('$4')} AS reactions
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    LEFT JOIN files uf ON uf.id = u.profile_image_id
    LEFT JOIN blocked_users b1
      ON b1.blocker_id = $4
      AND b1.blocked_id = u.id
    LEFT JOIN blocked_users b2
      ON b2.blocker_id = u.id
      AND b2.blocked_id = $4
    LEFT JOIN message_attachments ma ON ma.message_id = m.id
    LEFT JOIN files f ON f.id = ma.file_id
    LEFT JOIN messages rm ON rm.id = m.reply_to_message_id
    LEFT JOIN users rmu ON rmu.id = rm.sender_id
    LEFT JOIN files rmuf ON rmuf.id = rmu.profile_image_id
    LEFT JOIN blocked_users rmb1
      ON rmb1.blocker_id = $4
      AND rmb1.blocked_id = rmu.id
    LEFT JOIN blocked_users rmb2
      ON rmb2.blocker_id = rmu.id
      AND rmb2.blocked_id = $4
    WHERE ${whereClause}
    GROUP BY m.id, u.id, uf.id, uf.url, b1.blocker_id, b2.blocker_id,
      rm.id, rm.content, rm.created_at, rmu.id, rmuf.id, rmuf.url, rmb1.blocker_id, rmb2.blocker_id
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
  is_deletable?: boolean
  place_id?: string
  country_code?: string
  members: {
    id: string;
    is_admin: boolean;
    notification_enabled: boolean;
  }[];
}

export async function createConversation(db: DatabaseClient,  
  { name, is_group = false, is_private = false, is_womans_only = false, members =[], is_deletable = true, place_id, country_code }:CreateConversationInput){
  
  if (is_group) {
    if (is_deletable){
      if (!name || name.trim().length === 0) throw new ServerError('ERROR', 'Group conversation must have a name');
      if (members.length === 0) throw new ServerError('ERROR', 'Group conversation must have at least one participant');
      if ([...new Set(members.map(p => p.id))].length !== members.length) throw new ServerError('ERROR', 'Duplicate participants');
      if (!members.some(p => p.is_admin)) throw new ServerError('ERROR', 'At least one participant must be an admin');
    }
  } else {
    if (members.length !== 2) throw new ServerError('ERROR', 'Direct conversation must have exactly two participants');
    if (members[0].id === members[1].id) throw new ServerError('ERROR', 'You cannot create a conversation with yourself');
    
    const existingConversation = await getPersonalConversation(db, members[0].id, members[1].id);

    if (existingConversation) return existingConversation;
  }

  try{
    await db.begin();

    const conversation = await db.queryOne(`
      INSERT INTO conversations (name, is_group, is_private, is_womans_only, is_deletable, place_id, country_code) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name
    `, [name, is_group, is_private, is_womans_only, is_deletable, place_id, country_code]);



    for (const participant of members) {
      await db.query(`
        INSERT INTO conversation_members (conversation_id, user_id, is_admin, notification_enabled)
        VALUES ($1, $2, $3, $4)
      `, [conversation.id, participant.id, participant.is_admin, participant.notification_enabled ?? true]);
    }

    await db.commit();

    const conversationMembers = await db.queryAll(`
      SELECT user_id FROM conversation_members WHERE conversation_id = $1
    `, [conversation.id]);

    if (conversationMembers.length > 0) {
      for (const member of conversationMembers) {
        Socket.io?.in(member.user_id).socketsJoin(conversation.id);
      }
      Socket.io?.in(conversation.id).emit('conversation:new', { conversation_id: conversation.id });
    }

    return conversation;
  } catch (error) {
    await db.rollback();
    throw error;
  }
}


export async function addMemberToConversation(db: DatabaseClient, conversationId: string, userId: string, isAdmin: boolean = false, isMute: boolean = false): Promise<void> {

  const member = await db.queryOne(`
      INSERT INTO conversation_members (conversation_id, user_id, is_admin, notification_enabled)
      VALUES ($1, $2, $3, $4)
      RETURNING conversation_id, user_id, is_admin, notification_enabled
    `, [conversationId, userId, isAdmin, !isMute]);

  if (member) {
    Socket.io.in(userId).socketsJoin(conversationId);
  }

  return member;
}


export async function createJoiningRequest(db: DatabaseClient, conversationId: string, userId: string, isMute: boolean = false): Promise<void> {
  const joiningRequest = await db.queryOne(`
    INSERT INTO conversation_joining_requests (conversation_id, user_id, notification_enabled)
    VALUES ($1, $2, $3)
    RETURNING conversation_id, user_id, notification_enabled
  `, [conversationId, userId, !isMute]);

  ServerEvent.emit('conversation:conversation_joining_request:created', { conversation_id: conversationId, user_id: userId });

  return joiningRequest;
}

export async function isAdminOfConversation(db: DatabaseClient, conversationId: string, userId: string): Promise<boolean> {
  const admin = await db.queryOne(`
    SELECT is_admin FROM conversation_members WHERE conversation_id = $1 AND user_id = $2
  `, [conversationId, userId]);

  if (!admin) return false;

  return admin.is_admin;
}

