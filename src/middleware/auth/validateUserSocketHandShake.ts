import ServerError from '@/utils/serverError.js';
import Token from '@/utils/jwtToken.js';
import { Socket } from 'socket.io';
import Database from '@/service/database/index.js';

export default async function validateUserSocketHandShake(socket: Socket, next: (err?: Error) => void) {
  try {

    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) throw new ServerError('UNAUTHORIZED', 'token is required');
    if (!token.startsWith('Bearer ')) throw new ServerError('UNAUTHORIZED', 'invalid token');
  
    const tokenString = token.split(' ')[1];
    if (!tokenString) throw new ServerError('UNAUTHORIZED', 'token is required');
  
    const payload = Token.decode(tokenString);
    if (!payload || payload.type !== 'user_auth_token') throw new ServerError('UNAUTHORIZED', 'invalid token');
  
    socket.join(payload.user_id);

    const db = await Database.getConnection();

    try{

      const conversations = await db.queryAll(`
        SELECT
          conversation_id as id 
        FROM conversation_members
        WHERE user_id = $1
      `, [payload.user_id]);

      conversations.forEach(conversation => {
        socket.join(conversation.id);
      });

      const user = await db.queryOne(`
          SELECT
            u.id,
            u.full_name, 
            u.email,
            f.url as profile_image_url
          FROM users u
          LEFT JOIN files f ON f.id = u.profile_image_id
        `);

      socket.data.user = user;

    } finally{
      db.release();
    }

    next();
  } catch (error) {
    next(error);
  }
}