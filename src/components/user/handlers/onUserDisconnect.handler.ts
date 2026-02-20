import Logger from '@/service/logger/index.js';
import { HandlerContext } from '@/socket/socket.type.js';

export default async function onUserDisconnectHandler({ io, socket }: HandlerContext){

  const userId = socket.data.user!.id;

  Logger.info(`User disconnected: ${userId} (socket: ${socket.id})`);

  const remaining = await io.in(userId).fetchSockets();

  if (remaining.length === 1) {
    socket.rooms.forEach(room => {
      if (room !== userId) {
        socket.to(room).emit('user:offline', { user_id: userId });
      }
    });
  }
}