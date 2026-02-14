import { Socket, Namespace } from 'socket.io';


export default (namespace: Namespace, socket: Socket) => {
  socket.on('ping', () => {
    socket.emit('pong', { message: 'pong' });
  });

};
