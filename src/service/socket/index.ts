import { Server, Namespace, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import Logger from '@/service/logger/index.js';
import initHandlers from './initHandlers.js';
import ServerError from '@/utils/serverError.js';
import Token from '@/utils/jwtToken.js';

export function validateToken(token: string) : { user_id: string, type: 'user_auth_token' } {

  if (!token) throw new ServerError('UNAUTHORIZED', 'token is required');
  if (!token.startsWith('Bearer ')) throw new ServerError('UNAUTHORIZED', 'invalid token');

  const tokenString = token.split(' ')[1];
  if (!tokenString) throw new ServerError('UNAUTHORIZED', 'token is required');

  const payload = Token.decode(tokenString);
  if (!payload || !['user_auth_token'].includes(payload.type)) throw new ServerError('UNAUTHORIZED', 'invalid token');

  return payload as { user_id: string, type: 'user_auth_token' };
}

async function validateHandshake(socket: Socket, next: (err?: Error) => void) {
  try {

    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

    const { user_id } = validateToken(token);
    socket.join(user_id);
  } catch (error) {
    next(error);
  }
}

let userSocketIo: Namespace | null = null;

const SocketService = {

  get userIo() { return userSocketIo; },

  listen: (server: HttpServer) => {

    const io = new Server(server, {
      transports: ['websocket'],
      cors: { origin: true, credentials: true },
      path: '/websocket',
    });

    userSocketIo = io.of('/user');

    // validate handshake
    userSocketIo.use(validateHandshake);

    io.on('connection', (socket) => {
      Logger.info(`User connected: ${socket.id}`);
      initHandlers(io, socket);
    });

    io.on('disconnect', (socket) => {
      Logger.info(`User disconnected: ${socket.id}`);
    });

    return io;
  },
};

export default SocketService;
