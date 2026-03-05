import { Namespace, Socket } from 'socket.io';
import Logger from '@/service/logger/index.js';
import registerUserHandlers from '@/modules/user/registerUserHandlers.js';


export default async function Handler(io: Namespace, socket: Socket) {

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

  registerUserHandlers(io, socket);

}