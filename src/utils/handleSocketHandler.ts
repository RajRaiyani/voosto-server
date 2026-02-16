import { Namespace, Socket } from 'socket.io';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';

import Database from '@/service/database/index.js';


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
  handler: (io: Namespace, socket: Socket, payload: z.infer<typeof schema>, callback: (response: any) => void, db?: DatabaseClient) => Promise<void>;
  options?: {
    withDatabase?: boolean;
  };
}) {

  return async (payload: any, callback: (response: any) => void) => {
    
    let validatedData = payload;

    if (schema) {
      const validationResult = schema.safeParse(payload);

      if (!validationResult.success) {
        return callback({ success: false, code: 'validation_error', message: validationResult.error.message });
      }

      validatedData = validationResult.data;
    }

    try{
      if (options.withDatabase) {
        const db = await Database.getConnection();
        
        try{
          await handler(io, socket, validatedData, callback, db);
        } finally { db.release(); }

      } else {
        await handler(io, socket, validatedData, callback);
      }

    } catch (error) {
      socket.emit('error', { success: false, code: 'error', message: error.message });
      return callback({ success: false, code: 'error', message: error.message });
    }

  };
}