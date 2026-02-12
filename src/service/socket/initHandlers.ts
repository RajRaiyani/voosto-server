import { Socket, Namespace } from 'socket.io';
import Database from '@/service/database/index.js';
import {
  ensureParticipant,
  createMessage,
  markConversationSeen,
} from '@/components/chat/chat.service.js';

const CONVERSATION_ROOM_PREFIX = 'conversation:';

export default (namespace: Namespace, socket: Socket) => {
  socket.on('ping', () => {
    socket.emit('pong', { message: 'pong' });
  });

  socket.on('join_conversation', async (payload: { conversation_id: string }, callback) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId || !payload?.conversation_id) {
      callback?.({ success: false, message: 'Invalid payload' });
      return;
    }
    const db = await Database.getConnection();
    try {
      await ensureParticipant(db, payload.conversation_id, userId);
      const room = `${CONVERSATION_ROOM_PREFIX}${payload.conversation_id}`;
      await socket.join(room);
      callback?.({ success: true, room });
    } catch (err) {
      callback?.({ success: false, message: err instanceof Error ? err.message : 'Forbidden' });
    } finally {
      db.release();
    }
  });

  socket.on('leave_conversation', (payload: { conversation_id: string }) => {
    if (payload?.conversation_id) {
      socket.leave(`${CONVERSATION_ROOM_PREFIX}${payload.conversation_id}`);
    }
  });

  socket.on(
    'send_message',
    async (
      payload: { conversation_id: string; content: string },
      callback?: (res: { success: boolean; message?: string; data?: unknown }) => void
    ) => {
      const userId = (socket.data as { userId?: string }).userId;
      if (!userId || !payload?.conversation_id) {
        callback?.({ success: false, message: 'Invalid payload' });
        return;
      }
      const db = await Database.getConnection();
      try {
        await ensureParticipant(db, payload.conversation_id, userId);
        const messagePayload = await createMessage(
          db,
          payload.conversation_id,
          userId,
          payload.content ?? ''
        );
        namespace
          .to(`${CONVERSATION_ROOM_PREFIX}${payload.conversation_id}`)
          .emit('message:new', messagePayload);
        callback?.({ success: true, data: messagePayload });
      } catch (err) {
        callback?.({
          success: false,
          message: err instanceof Error ? err.message : 'Failed to send message',
        });
      } finally {
        db.release();
      }
    }
  );

  socket.on(
    'mark_messages_seen',
    async (
      payload: { conversation_id: string },
      callback?: (res: { success: boolean; message?: string }) => void
    ) => {
      const userId = (socket.data as { userId?: string }).userId;

      if (!userId || !payload?.conversation_id) {
        callback?.({ success: false, message: 'Invalid payload' });
        return;
      }
      
      const db = await Database.getConnection();
      try {
        await ensureParticipant(db, payload.conversation_id, userId);
        await markConversationSeen(db, payload.conversation_id, userId);
        const seenPayload = {
          conversation_id: payload.conversation_id,
          seen_by: userId,
          seen_at: new Date().toISOString(),
        };
        namespace
          .to(`${CONVERSATION_ROOM_PREFIX}${payload.conversation_id}`)
          .emit('messages:seen', seenPayload);
        callback?.({ success: true });
      } catch (err) {
        callback?.({
          success: false,
          message: err instanceof Error ? err.message : 'Failed to mark as seen',
        });
      } finally {
        db.release();
      }
    }
  );
};
