import EventEmitter from 'events';
import { DatabaseClient } from '@/service/database/index.js';
import Database from '@/service/database/index.js';


const eventEmitter = new EventEmitter();

export type options = {
  withDatabase: boolean;
} | undefined;


export type EventContext = {
  db?: DatabaseClient;
};

export type EventHandler = (ctx: EventContext, ...args: any[]) => Promise<void>;

export function EventContextProvider(handler: EventHandler, options: options = { withDatabase: false }) {
  return async (...args: any[]) => {
    if (options.withDatabase) {
      const db = await Database.getConnection();
      try {
        await handler({ db }, ...args);
      } catch (error) {
        eventEmitter.emit('error', error);
      } finally {
        db.release();
      }
    } else {
      try {
        await handler({}, ...args);
      } catch (error) {
        eventEmitter.emit('error', error);
      }
    }
  };
  
}

export default eventEmitter;
