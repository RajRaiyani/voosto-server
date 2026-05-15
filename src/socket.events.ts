import Logger from '@/service/logger/index.js';
import handleSocketHandler, { type Context as SocketContext } from '@/core/registerSocketEventHandler.js';
import { ValidationSchema as MessageSendValidationSchema, Handler as MessageSendHandler } from '@/modules/conversation/handlers/socket/onMessageSend.handler.js';
import { Handler as onUserDisconnectHandler } from '@/modules/user/handlers/socket/onUserDisconnect.handler.js';
import { ValidationSchema as MessageSeenValidationSchema, Handler as MessageSeenHandler } from '@/modules/conversation/handlers/socket/onMessageSeen.handler.js';
import { ValidationSchema as MessageDeleteValidationSchema, Handler as MessageDeleteHandler } from '@/modules/conversation/handlers/socket/onMessageDelete.handler.js';
import { ValidationSchema as MessageReactionValidationSchema, Handler as MessageReactionHandler } from '@/modules/conversation/handlers/socket/onMessageReaction.handler.js';

export default async function Handler({ io, socket }: SocketContext) {

  const user = socket.data.user;
  if (!user) return;

  const userId: string = user.id;

  Logger.info(`User connected: ${userId} (socket: ${socket.id})`);


  const sockets = await io.in(userId).fetchSockets();
  if (sockets.length === 1) {
    socket.rooms.forEach(room => {
      if (room !== userId) {
        socket.to(room).emit('user:online', { user_id: userId });
      }
    });
  }

  socket.on('ping', (message: string) => {
    socket.emit('pong', message);
  });

  socket.on('message:new', handleSocketHandler({
    io,
    socket,
    schema: MessageSendValidationSchema,
    handler: MessageSendHandler,
    options: { withDatabase: true },
  }));

  socket.on('message:seen', handleSocketHandler({
    io,
    socket,
    schema: MessageSeenValidationSchema,
    handler: MessageSeenHandler,
    options: { withDatabase: true },
  }));

  socket.on('message:delete', handleSocketHandler({
    io,
    socket,
    schema: MessageDeleteValidationSchema,
    handler: MessageDeleteHandler,
    options: { withDatabase: true },
  }));

  socket.on('message:reaction', handleSocketHandler({
    io,
    socket,
    schema: MessageReactionValidationSchema,
    handler: MessageReactionHandler,
    options: { withDatabase: true },
  }));

  socket.on('disconnect', handleSocketHandler({
    io,
    socket,
    handler: onUserDisconnectHandler,
  }));
}