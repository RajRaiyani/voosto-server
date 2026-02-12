import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import SocketService from '@/service/socket/index.js';
import { conversationIdParam } from './chat.validation.js';
import { sendMessageBody } from './chat.validation.js';
import { ensureParticipant, createMessage } from './chat.service.js';

export const ValidationSchema = {
  params: conversationIdParam,
  body: sendMessageBody,
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id } = req.params as z.infer<typeof conversationIdParam>;
  const { content } = req.body as z.infer<typeof sendMessageBody>;
  const userId = req.user!.id;

  await ensureParticipant(db, conversation_id, userId);
  const payload = await createMessage(db, conversation_id, userId, content);

  const userIo = SocketService.userIo;
  if (userIo) {
    userIo.to(`conversation:${conversation_id}`).emit('message:new', payload);
  }

  return res.status(201).json(payload);
}
