import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { isAdminOfConversation, removeMemberFromConversation, deleteConversation } from '@/modules/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user.id;

  const isAdmin = await isAdminOfConversation(db, conversation_id, userId);
  if (isAdmin) return res.status(400).json({ message: 'Admin can not leave conversation' });

  const conversation = await db.queryOne(`
    SELECT is_group FROM conversations WHERE id = $1
  `, [conversation_id]);

  try{
    await db.begin();

    if (conversation?.is_group) {
  
      await removeMemberFromConversation({ database: db }, conversation_id, userId);

    }else {
      await deleteConversation({ database: db }, conversation_id);
    }
    
    await db.commit();

    return res.status(204).send();


  } catch (error) {
    await db.rollback();
    throw error;
  }

}