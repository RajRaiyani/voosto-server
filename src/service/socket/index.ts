import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import Logger from '@/service/logger/index.js';
import initHandlers from './initHandlers.js';
import ServerError from '@/utils/serverError.js';
import Database from '@/service/database/index.js';
import Token from '@/utils/jwtToken.js';

export function validateToken(token: string) : { session_id: string, user_id: string, type: 'admin_access_token' } | { customer_id: string, type: 'customer_access_token' } {

  if (!token) throw new ServerError('UNAUTHORIZED', 'token is required');
  if (!token.startsWith('Bearer ')) throw new ServerError('UNAUTHORIZED', 'invalid token');

  const tokenString = token.split(' ')[1];
  if (!tokenString) throw new ServerError('UNAUTHORIZED', 'token is required');

  const payload = Token.decode(tokenString);
  if (!payload || !['admin_access_token', 'customer_access_token'].includes(payload.type)) throw new ServerError('UNAUTHORIZED', 'invalid token');

  return payload as { session_id: string, user_id: string, type: 'admin_access_token' } | { customer_id: string, type : 'customer_access_token' };
}

async function validateHandshake(socket: Socket, next: (err?: Error) => void) {
  try {

    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

    const tokenPayload = validateToken(token);
    let devices: { imei: string }[] = [];

    const db = await Database.getConnection();
    try {

      if (tokenPayload.type === 'customer_access_token') {
        devices = await db.queryAll(`
          SELECT d.imei
          FROM devices d
          WHERE d.customer_id = $1
        `, [tokenPayload.customer_id]);
      }

      if (tokenPayload.type === 'admin_access_token') {
        const session = await db.queryOne(`
        SELECT us.id, u.id as user_id, u.is_root_user
        FROM user_sessions us
        LEFT JOIN users u ON u.id = us.user_id
        WHERE us.id = $1 and us.is_active = true and us.expires_at > NOW()
      `, [tokenPayload.session_id]);

        if (!session) throw new ServerError('UNAUTHORIZED', 'session expired');

        if (session.is_root_user) {
          devices = await db.queryAll('SELECT imei FROM devices');
        } else {
          devices = await db.queryAll(`
          SELECT d.imei
          FROM user_device_mapping udm
          LEFT JOIN devices d ON d.id = udm.device_id
          WHERE udm.user_id = $1
        `, [session.user_id]);
        }
      }

      // join the socket to the devices
      devices.forEach((device: { imei: string }) => socket.join(device.imei));

      next();
    } finally {
      db.release();
    }
  } catch (error) {
    next(error);
  }
}

let socketIo: Server | null = null;

const SocketService = {

  get io() { return socketIo; },

  listen: (server: HttpServer) => {

    const io = new Server(server, {
      transports: ['websocket'],
      cors: { origin: true, credentials: true },
    });

    socketIo = io;

    // validate handshake
    io.use(validateHandshake);

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
