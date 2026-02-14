import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { getConversationById, isMemberOfConversation, createJoiningRequest } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user.id;

  const user = await db.queryOne ('SELECT id, gender FROM users WHERE id = $1', [userId]);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMan = user.gender === 'male' ? true : false;

  const conversation = await getConversationById(db, conversation_id, userId);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const isMember = await isMemberOfConversation(db, conversation_id, userId);
  if (isMember) return res.status(400).json({ message: 'You are already a member of this conversation' });

  if (conversation.is_womans_only && isMan) {
    return res.status(400).json({ message: 'You cannot join a womans only conversation as a man' });
  }

  if (!conversation.is_private) {
    return res.status(400).json({ message: 'You cannot create a joining request for a public conversation' });
  }

  const pendingRequest = await db.queryOne(`
    SELECT conversation_id, created_at FROM conversation_joining_requests WHERE conversation_id = $1 AND user_id = $2
  `, [conversation_id, userId]);  

  if (pendingRequest) {
    return res.status(400).json({ message: 'You have already created a joining request for this conversation' });
  }

  const joiningRequest = await createJoiningRequest(db, conversation_id, userId);

  return res.status(200).json(joiningRequest);
}