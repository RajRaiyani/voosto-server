import { Namespace, Socket } from 'socket.io';
import { z } from 'zod';
import { validateData } from '@/utils/validationHelper.js';
import Database from '@/service/database/index.js';

import {  SocketCallback, SocketEventHandler } from '@/socket/socket.type.js';

type HandleSocketHandlerOptions = {
  withDatabase?: boolean;
};


function sendError(
  socket: Socket,
  callback: SocketCallback,
  code: string,
  message: string,
  details?: any
): void {
  const errorPayload = { success: false, code, message, details };

  if (typeof callback === 'function') {
    callback(errorPayload);
  } else {
    socket.emit('server_error', errorPayload);
  }
}

export default function handleSocketHandler({
  io,
  socket,
  schema,
  handler,
  options = { withDatabase: false }
}: {
  io: Namespace;
  socket: Socket;
  schema?: z.ZodSchema;
  handler: SocketEventHandler;
  options?: HandleSocketHandlerOptions;
}) {

  return async (payload: any, callback: SocketCallback) => {
    
    let validatedData = payload;

    if (schema) {
      try {
        validatedData = validateData(schema, payload);
      } catch (error) {
        return sendError(socket, callback, 'validation_error', error.message, error.details);
      }
    }

    try{
      if (options.withDatabase) {
        const db = await Database.getConnection();

        try{
          await handler({ io, socket, db }, validatedData, callback);
        } finally { db.release(); }

      } else {
        await handler({ io, socket }, validatedData, callback);
      }

    } catch (error) {
      return sendError(socket, callback, 'error', error.message, error.stack);
    }

  };
}