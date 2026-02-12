import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import SocketService from '@/service/socket/index.js';
import { conversationIdParam } from './chat.validation.js';
import { ensureParticipant, markConversationSeen } from './chat.service.js';

export const ValidationSchema = {
  params: conversationIdParam,
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id } = req.params as z.infer<typeof conversationIdParam>;
  const userId = req.user!.id;

  await ensureParticipant(db, conversation_id, userId);
  await markConversationSeen(db, conversation_id, userId);

  const userIo = SocketService.userIo;
  if (userIo) {
    userIo.to(`conversation:${conversation_id}`).emit('messages:seen', {
      conversation_id,
      seen_by: userId,
      seen_at: new Date().toISOString(),
    });
  }

  return res.status(204).send();
}
