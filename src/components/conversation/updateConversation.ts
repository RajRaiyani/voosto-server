import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { DatabaseClient } from '@/service/database/index.js';
import { isAdminOfConversation } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
  body: z
    .object({
      name: Schema.name().optional(),
      display_picture_id: Schema.uuid().nullable().optional(),
    })
    .refine(
      (data) => data.name !== undefined || data.display_picture_id !== undefined,
      {
        message: 'At least one of name or display_picture_id must be provided',
        path: ['name'],
      }
    ),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { name, display_picture_id } = req.body as z.infer<typeof ValidationSchema.body>;
  const userId = req.user!.id;

  const isAdmin = await isAdminOfConversation(db, conversation_id, userId);
  
  if (!isAdmin) {
    return res
      .status(403)
      .json({ message: 'Only conversation admins can update this conversation' });
  }

  const setParts: string[] = [];


  if (name !== undefined) {
    setParts.push('name = $name');
  }

  if (display_picture_id !== undefined) {
    setParts.push('display_picture_id = $display_picture_id');
  }

  setParts.push('updated_at = NOW()');

  const sql = `
    UPDATE conversations
    SET ${setParts.join(', ')}
    WHERE id = $conversation_id
    RETURNING id, name, is_group, is_private, is_womans_only, created_at, updated_at, display_picture_id
  `;

  const updated = await db.namedQueryOne(sql, req.body);
  if (!updated) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  return res.status(200).json(updated);
}

