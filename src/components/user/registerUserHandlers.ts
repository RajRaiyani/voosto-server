import { Namespace, Socket } from 'socket.io';

import handleSocketHandler from '@/utils/handleSocketHandler.js';
import { ValidationSchema as MessageSendValidationSchema, Handler as MessageSendHandler } from '@/components/conversation/handler/socket/onMessageSend.handler.js';
import onUserDisconnectHandler from '@/components/user/handlers/onUserDisconnect.handler.js';

export default function registerUserHandlers(io: Namespace, socket: Socket,) {

  socket.on('ping', (message: string) => {
    socket.emit('pong', message);
  });

  socket.on('message:send', handleSocketHandler({
    io,
    socket,
    schema: MessageSendValidationSchema,
    handler: MessageSendHandler,
    options: { withDatabase: true },
  }));

  socket.on('disconnect', handleSocketHandler({
    io,
    socket,
    handler: onUserDisconnectHandler,
  }));

}

