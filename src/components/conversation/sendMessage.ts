import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { ensureMember, createMessage } from './conversation.service.js';
import Schema from '@/config/validationSchema.js';
import ChatValidationSchema from './conversation.validation.js';
import { RegisterFile } from '@/components/file/file.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
  body: z.object({
    content: ChatValidationSchema.message.content().optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { content } = req.body as z.infer<typeof ValidationSchema.body>;
  const files = req.files as Express.Multer.File[];
  const userId = req.user!.id;

  await ensureMember(db, conversation_id, userId);

  try{
    await db.begin();
    
    const attachments = await Promise.all(files.map((file) => {
      return RegisterFile(db, file.path);
    }));

    const message = await createMessage(db, {
      conversationId: conversation_id,
      senderId: userId,
      content: content,
      attachments: attachments.map(f => f.id),
    });
    await db.commit();

    return res.status(200).json(message);
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
