import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import ServerEvent from '@/service/event/index.js';

export const ValidationSchema = {
  body: z.object({
    sender_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { sender_id } = req.body as z.infer<typeof ValidationSchema.body>;
  const receiver_id = req.user.id;

  const friendMapping = await db.queryOne(`
    SELECT sender_id, receiver_id, status 
    FROM friend_mappings 
    WHERE sender_id = $1 AND receiver_id = $2
  `, [sender_id, receiver_id]);

  if (!friendMapping) {
    return res.status(404).json({ message: 'Friend request not found' });
  }

  if (friendMapping.status === 'accepted') {
    return res.status(400).json({ message: 'Friend request already accepted' });
  }

  if (friendMapping.status !== 'pending') {
    return res.status(400).json({ message: 'Invalid request status' });
  }

  const updatedMapping = await db.queryOne(`
    UPDATE friend_mappings 
    SET status = 'accepted'
    WHERE sender_id = $1 AND receiver_id = $2
    RETURNING sender_id, receiver_id, status, created_at
  `, [sender_id, receiver_id]);

  ServerEvent.emit('friend_request:accepted', { sender_id, receiver_id });

  return res.status(200).json(updatedMapping);
}