import { Server, Socket } from 'socket.io';

export default (io: Server, socket: Socket) => {
  socket.on('ping', () => {
    socket.emit('pong', { message: 'pong' });
  });
};
