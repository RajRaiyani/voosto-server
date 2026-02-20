import { Namespace } from 'socket.io';
import Logger from '@/service/logger/index.js';
import onUserConnectHandler from '@/components/user/handlers/onUserConnect.handler.js';

export default function userSocketHandler(io: Namespace) {

  io.on('connection', (socket) => onUserConnectHandler(io, socket));

  io.on('error', (error) => {
    Logger.error(`Socket error: ${error}`);
  });

}