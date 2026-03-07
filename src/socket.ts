import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import Logger from '@/service/logger/index.js';
import Handler from '@/socket.events.js';


import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import env from '@/config/env.js';

import validateUserSocketHandShake from '@/middleware/auth/validateUserSocketHandShake.js';


const pubClient = createClient({
  url: env.redis.url,
});

const subClient = pubClient.duplicate();

let socketIo: Server | null = null;


function initSocketHandler(io: Server) {

  io.on('connection', (socket) => Handler({ io, socket }));

  io.on('connect_error', (error) => {
    Logger.error(`Socket connection error: ${error}`);
  });

  io.on('error', (error) => {
    Logger.error(`Socket error: ${error}`);
  });

}

export async function initSocket (server: HttpServer) {

  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
  ]);

  const io = new Server(server, {
    adapter: createAdapter(pubClient, subClient),
    transports: ['websocket'],
  });

  socketIo = io;

  io.use(validateUserSocketHandShake);

  initSocketHandler(io);

  return io;
}

const SocketService = {
  get io() { return socketIo; },

  listen: initSocket,

  async isUserOnline(userId: string): Promise<boolean> {
    if (!socketIo) return false;

    const sockets = await socketIo.in(userId).fetchSockets();
    return sockets.length > 0;
  },
};

export default SocketService;
