import { Namespace, Socket } from 'socket.io';
import { DatabaseClient } from '@/service/database/index.js';


export type SocketCallback = ((response: unknown) => void) | undefined;

export type HandlerContext = {
  io: Namespace;
  socket: Socket;
  db?: DatabaseClient;
};

export type SocketEventHandler = (
  ctx: HandlerContext,
  payload: any | undefined,
  callback: SocketCallback
) => Promise<void>;