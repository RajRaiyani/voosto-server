import RegisterService, { Context as ServiceContext } from '@/core/registerService.js';
import Socket from '@/socket.js';



async function deleteConversationService({ database:db }: ServiceContext, conversation_id: string) {

  try{
    await db.begin();

    await db.query('DELETE FROM conversation_members WHERE conversation_id = $1', [conversation_id]);
    await db.query('DELETE FROM conversation_joining_requests WHERE conversation_id = $1', [conversation_id]);
    await db.query('DELETE FROM message_reads WHERE message_id in (select id from messages where conversation_id = $1)', [conversation_id]);
    await db.query('DELETE FROM message_attachments where message_id in (select id from messages where conversation_id = $1)', [conversation_id]);
    await db.query('DELETE FROM messages WHERE conversation_id = $1', [conversation_id]);
    await db.query('DELETE FROM conversations WHERE id = $1', [conversation_id]);

    await db.commit();
    
    Socket.io.to(conversation_id).emit('conversation:delete', { conversation_id });

  }catch(error){
    await db.rollback();
    throw error;
  }
}

export const deleteConversation = RegisterService(deleteConversationService);
