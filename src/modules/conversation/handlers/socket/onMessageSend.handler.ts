import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { createMessage } from '@/modules/conversation/conversation.service.js';
import { saveFile } from '@/modules/file/file.service.js';
import { Context, SocketCallback } from '@/core/registerSocketEventHandler.js';



export const ValidationSchema = z.object({
  conversation_id: Schema.uuid(),
  content: z
    .string()
    .trim()
    .max(10000, 'Message content must be less than 10000 characters').default(''),
  attachments: z.array(z.uuid()).default([]),
});

export async function Handler(
  ctx: Context,
  payload: z.infer<typeof ValidationSchema>,
  callback: SocketCallback,
) {
  const { socket, database: db } = ctx;

  const { conversation_id, content, attachments } = payload;
  let message;
  let savedAttachments = [];

  try{
    await db.begin();

    savedAttachments = await Promise.all(attachments.map(async (attachment) => {
      return await saveFile({ database:db }, { id: attachment });
    }));
  
    message = await createMessage(db, {
      conversationId: conversation_id,
      senderId: socket.data.user.id,
      content: content.trim(),
      attachments,
    }, {
      socket: true,
      pushNotifications: true,
    });

    await db.commit();

    callback({ success: true, message_id: message.id });

  }catch (error) {
    await db.rollback();
    throw error;
  }

  socket.to(conversation_id).emit('message:new', {
    conversation_id,
    sender: socket.data.user,
    content,
    attachments: savedAttachments,
    id: message.id,
  });
  
}
