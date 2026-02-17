import { Namespace } from 'socket.io';
import Logger from '@/service/logger/index.js';
import registerUserHandlers from './registerUserHandlers.js';

export default function userSocketHandler(io: Namespace) {

  io.on('connection', async (socket) => {

    const user = socket.data.user;
    if (!user) return;

    const userId: string = user.id;

    Logger.info(`User connected: ${userId} (socket: ${socket.id})`);

    // fetchSockets returns all active sockets in the user's personal room
    // personal room = userId (joined in validateUserSocketHandShake)
    // if length is 1 → this is their first socket → just came online
    const sockets = await io.in(userId).fetchSockets();
    if (sockets.length === 1) {
      socket.broadcast.emit('user:online', { user_id: userId });
    }

    socket.on('ping', (message: string) => {
      socket.emit('pong', message);
    });

    registerUserHandlers(io, socket);

    socket.on('disconnect', async () => {
      Logger.info(`User disconnected: ${userId} (socket: ${socket.id})`);

      // after disconnect, check remaining sockets in personal room
      // if 0 → last socket gone → just went offline
      const remaining = await io.in(userId).fetchSockets();
      if (remaining.length === 1) {
        socket.broadcast.emit('user:offline', { user_id: userId });
      }
    });
  });

  io.on('error', (error) => {
    Logger.error(`Socket error: ${error}`);
  });

}