import EventEmitter from 'events';
import { DatabaseClient } from '@/service/database/index.js';
import Database from '@/service/database/index.js';
import { ServerEvent } from '@/types/serverEvent.type.js';


type TypedEmitter<T extends Record<string, (...args: any[]) => void>> = {
  on<K extends keyof T>(event: K, listener: T[K]): TypedEmitter<T>;
  off<K extends keyof T>(event: K, listener: T[K]): TypedEmitter<T>;
  once<K extends keyof T>(event: K, listener: T[K]): TypedEmitter<T>;
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean;
  removeAllListeners<K extends keyof T>(event?: K): TypedEmitter<T>;
};

const eventEmitter: TypedEmitter<ServerEvent> = new EventEmitter();



export type options = {
  withDatabase: boolean;
} | undefined;


export type EventContext = {
  db?: DatabaseClient;
};

export type ServiceHandler<TArgs extends any[], TResult> = (
  context: EventContext,
  ...args: TArgs
) => Promise<TResult>;

export function EventContextProvider<TArgs extends any[], TResult>(
  handler: ServiceHandler<TArgs, TResult>,
  options: options = { withDatabase: false }
): (...args: TArgs) => void {
  
  return (async (...args: TArgs): Promise<TResult> => {
    if (options.withDatabase) {
      const db = await Database.getConnection();
      try {
        return await handler({ db }, ...args);
      } catch (error) {
        eventEmitter.emit('error', error);
      } finally {
        db.release();
      }
    } else {
      try {
        return await handler({}, ...args);
      } catch (error) {
        eventEmitter.emit('error', error);
      }
    }
  });
}

export default eventEmitter;
