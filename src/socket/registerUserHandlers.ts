import { Namespace, Socket } from 'socket.io';

import handleSocketHandler from '@/utils/handleSocketHandler.js';
import { ValidationSchema as MessageSendValidationSchema, Handler as MessageSendHandler } from '@/components/conversation/socket-handler/onMessageSend.handler.js';

export default function registerUserHandlers(io: Namespace, socket: Socket,) {

  socket.on('message:send', handleSocketHandler({
    io,
    socket,
    schema: MessageSendValidationSchema,
    handler: MessageSendHandler,
    options: { withDatabase: true },
  }));


}

