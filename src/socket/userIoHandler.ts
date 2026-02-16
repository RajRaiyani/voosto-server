import { Namespace } from 'socket.io';
import Logger from '@/service/logger/index.js';
import registerUserHandlers from './registerUserHandlers.js';

export default function userSocketHandler(io: Namespace) {

  io.on('connection', async (socket) => {

    Logger.info(`User connected: ${socket.id}`);

    socket.on('ping', (message: string) => {
      Logger.info(`User pinged: ${message}`);
      socket.emit('pong', message);
    });

    registerUserHandlers(io, socket);
    
  });

  io.on('disconnect', (socket) => {
    Logger.info(`User disconnected: ${socket.id}`);
  });

  io.on('error', (error) => {
    Logger.error(`Socket error: ${error}`);
  });
}