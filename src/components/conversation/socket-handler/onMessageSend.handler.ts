import { Socket, Namespace } from 'socket.io';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { createMessage } from '@/components/conversation/conversation.service.js';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = z.object({
  conversation_id: Schema.uuid(),
  content: z.string().trim().max(10000, 'Message content must be less than 10000 characters'),
  attachments: z.array(z.uuid()).default([]),
});

export async function Handler(io: Namespace, socket: Socket, payload: z.infer<typeof ValidationSchema>, callback: (response: any) => void, db: DatabaseClient) {

  const { conversation_id, content, attachments } = payload;

  await createMessage(db, {
    conversationId: conversation_id,
    senderId: socket.data.user.id,
    content: content.trim(),
    attachments,
  }); 

  socket.to(conversation_id).emit('message:new', {
    conversation_id,
    sender: socket.data.user,
    content,
    attachments,
  });

  return callback({ success: true });

}