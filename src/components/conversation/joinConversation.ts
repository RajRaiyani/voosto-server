import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { getConversationById, isMemberOfConversation, addMemberToConversation, createJoiningRequest } from '@/components/conversation/conversation.service.js';
import SocketService from '@/socket/index.js';

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

  if (isMember) {
    return res.status(204).send();
  }

  if (conversation.is_womans_only && isMan) {
    return res.status(400).json({ message: 'You cannot join a womans only conversation as a man' });
  }

  if (conversation.is_private ) {
    const pendingRequest = await db.queryOne(`
    SELECT conversation_id, created_at FROM conversation_joining_requests WHERE conversation_id = $1 AND user_id = $2
  `, [conversation_id, userId]);  

    if (pendingRequest) {
      return res.status(200).json(pendingRequest);
    }

    const joiningRequest = await createJoiningRequest(db, conversation_id, userId);
  
    return res.status(200).json(joiningRequest);
  }

  await addMemberToConversation(db, conversation_id, userId, false);

  const userIo = SocketService.userIo;
  if (userIo) {
    const member = await db.queryOne<{ id: string; full_name: string; profile_image_url: string | null }>(`
      SELECT u.id, u.full_name, f.url AS profile_image_url
      FROM users u
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE u.id = $1
    `, [userId]);
    const payload = {
      conversation_id,
      user: member ? { id: member.id, full_name: member.full_name, profile_image_url: member.profile_image_url } : { id: userId, full_name: '', profile_image_url: null },
    };
    userIo.to(conversation_id).emit('conversation:member_joined', payload);
    userIo.in(userId).socketsJoin(conversation_id);
  }
  return res.status(204).send();
}