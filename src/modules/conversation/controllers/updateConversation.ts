import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { DatabaseClient } from '@/service/database/index.js';
import { isAdminOfConversation, ensureMember } from '@/modules/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
  body: z
    .object({
      name: Schema.name().optional(),
      display_picture_id: Schema.uuid().nullable().optional(),
      notification_enabled: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.display_picture_id !== undefined ||
        data.notification_enabled !== undefined,
      {
        message:
          'At least one of name or display_picture_id or notification_enabled must be provided',
        path: ['name'],
      },
    ),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { conversation_id } = req.params as z.infer<
    typeof ValidationSchema.params
  >;
  const { name, display_picture_id, notification_enabled } =
    req.body as z.infer<typeof ValidationSchema.body>;
  const userId = req.user!.id;

  await ensureMember(db, conversation_id, userId);

  const setParts: string[] = [];

  

  if (name !== undefined || display_picture_id !== undefined) {
    const isAdmin = await isAdminOfConversation(db, conversation_id, userId);

    if (!isAdmin) {
      return res
        .status(403)
        .json({
          message: 'Only conversation admins can update this conversation',
        });
    }

    if (name !== undefined) {
      setParts.push('name = $name');
    }

    if (display_picture_id !== undefined) {
      setParts.push('display_picture_id = $display_picture_id');
    }
  }



  if (notification_enabled !== undefined) {
    await db.query(
      `
      UPDATE conversation_members
      SET notification_enabled = $1
      WHERE conversation_id = $2 AND user_id = $3
    `,
      [notification_enabled, conversation_id, userId],
    );
  }

  if (setParts.length > 0) {
    const sql = `
      UPDATE conversations
      SET ${setParts.join(', ')}
      WHERE id = $conversation_id
      RETURNING id, name, is_group, is_private, is_womans_only, created_at, display_picture_id
    `;

    const updated = await db.namedQueryOne(sql, {
      name,
      display_picture_id,
      conversation_id,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    return res.status(204).send();
  }

  return res.status(204).send();
}
