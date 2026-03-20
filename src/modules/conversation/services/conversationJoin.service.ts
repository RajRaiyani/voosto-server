import RegisterService, { Context as ServiceContext } from '@/core/registerService.js';
import Socket from '@/socket.js';
import ServerEvent from '@/service/event/index.js';
import { deleteConversation } from '@/modules/conversation/services/conversationOperation.service.js';

async function acceptConversationJoiningRequestService(ctx: ServiceContext, { conversation_id, user_id, accepted_by }: { conversation_id: string, user_id: string, accepted_by: string }) {
  try{
    await ctx.database.begin();

    const joiningRequest = await ctx.database.queryOne(`
      INSERT INTO conversation_members (conversation_id, user_id, notification_enabled)
      SELECT conversation_id, user_id, notification_enabled
      FROM conversation_joining_requests
      WHERE conversation_id = $1 AND user_id = $2
      RETURNING conversation_id, user_id, notification_enabled
    `, [conversation_id, user_id]);

    await ctx.database.query(`
      DELETE FROM conversation_joining_requests
      WHERE conversation_id = $1 AND user_id = $2
    `, [conversation_id, user_id]);

    if (joiningRequest && accepted_by) ServerEvent.emit('conversation:conversation_joining_request:accepted', { conversation_id, user_id, accepted_by });

    await ctx.database.commit();
  }catch(error){
    await ctx.database.rollback();
    throw error;
  }
}


async function rejectConversationJoiningRequestService(ctx: ServiceContext, { conversation_id, user_id, deleted_by }: { conversation_id: string, user_id: string, deleted_by?: string }) {

  const joiningRequest = await ctx.database.queryOne(`
      DELETE FROM conversation_joining_requests
      WHERE conversation_id = $1 AND user_id = $2
      RETURNING conversation_id, user_id
    `, [conversation_id, user_id]);

  if (joiningRequest && deleted_by) ServerEvent.emit('conversation:conversation_joining_request:rejected', { conversation_id, user_id, deleted_by });

  return joiningRequest;
}


async function removeMemberFromConversationService({ database:db }: ServiceContext, conversationId: string, userId: string): Promise<void> {
  try{

    await db.begin();

    const member = await db.queryOne(`
      DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2
      RETURNING conversation_id, user_id, is_admin
    `, [conversationId, userId]);

    if (member) {
      Socket.io.in(userId).socketsLeave(conversationId);
    }

    const memberCount = await db.queryOne(`
      SELECT COUNT(*) FROM conversation_members WHERE conversation_id = $1
    `, [conversationId]);

    if (memberCount.count === 0) {
      await deleteConversation({ database: db }, conversationId);
    }

    await db.commit();
    return member;
  } catch (error) {
    await db.rollback();
    throw error;
  }

}

export const acceptConversationJoiningRequest = RegisterService(acceptConversationJoiningRequestService);
export const rejectConversationJoiningRequest = RegisterService(rejectConversationJoiningRequestService);
export const removeMemberFromConversation = RegisterService(removeMemberFromConversationService);