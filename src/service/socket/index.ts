import { Server, Namespace, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import Logger from '@/service/logger/index.js';
import initHandlers from './initHandlers.js';
import ServerError from '@/utils/serverError.js';
import Token from '@/utils/jwtToken.js';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import env from '@/config/env.js';

const pubClient = createClient({
  url: env.redis.url,
});
const subClient = pubClient.duplicate();

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
    socket.data.userId = user_id;
    socket.join(user_id);
    next();
  } catch (error) {
    next(error);
  }
}

let socketIo: Server | null = null;
let userSocketIo: Namespace | null = null;

const SocketService = {

  get io() { return socketIo; },
  get userIo() { return userSocketIo; },

  listen: async (server: HttpServer) => {

    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    const io = new Server(server, {
      adapter: createAdapter(pubClient, subClient),
      transports: ['websocket'],
    });

    socketIo = io;
    userSocketIo = io.of('/user');

    // validate handshake
    userSocketIo.use(validateHandshake);


    userSocketIo.on('connection', (socket) => {
      Logger.info(`User connected: ${socket.id}`);
      initHandlers(userSocketIo, socket);
    });

    userSocketIo.on('disconnect', (socket) => {
      Logger.info(`User disconnected: ${socket.id}`);
    });

    return io;
  },
};

export default SocketService;
