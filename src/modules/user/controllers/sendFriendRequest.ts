import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import ServerEvent from '@/service/event/index.js';

export const ValidationSchema = {
  body: z.object({
    receiver_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { receiver_id } = req.body as z.infer<typeof ValidationSchema.body>;
  const sender_id = req.user.id;

  if (sender_id === receiver_id) {
    return res.status(400).json({ message: 'You cannot send friend request to yourself' });
  }

  const receiver = await db.queryOne('SELECT id FROM users WHERE id = $1', [receiver_id]);
  if (!receiver) {
    return res.status(404).json({ message: 'User not found' });
  }

  const existingMapping = await db.queryOne(`
    SELECT sender_id, receiver_id, status FROM friend_mappings 
    WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
  `, [sender_id, receiver_id]);

  if (existingMapping) {
    if (existingMapping.status === 'pending') {
      return res.status(400).json({ message: 'Friend request already sent' });
    }
    if (existingMapping.status === 'accepted') {
      return res.status(400).json({ message: 'You are already friends' });
    }
  }

  const friendMapping = await db.queryOne(`
    INSERT INTO friend_mappings (sender_id, receiver_id, status)
    VALUES ($1, $2, 'pending')
    RETURNING sender_id, receiver_id, status, created_at
  `, [sender_id, receiver_id]);

  ServerEvent.emit('user:friend_request:created', { sender_id, receiver_id });

  return res.status(201).json(friendMapping);
}