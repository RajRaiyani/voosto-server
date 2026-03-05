import type { DatabaseClient } from '@/service/database/index.js';
import DatabaseService from '@/service/database/index.js';

export interface Context {
  database: DatabaseClient | null;
}

export interface Options {
  database?: DatabaseClient;
  withDatabase?: boolean;
}

export type ServiceHandler<TArgs extends any[], TResult> = (
  context: Context,
  ...args: TArgs
) => Promise<TResult>;

function RegisterService<TArgs extends any[], TResult>(handler:ServiceHandler<TArgs, TResult> ) {
  return async (
    options: Options,
    ...args: TArgs
  ): Promise<TResult> => {
    const { database, withDatabase } = options;

    if (database !== undefined) {
      return handler({ database }, ...args);
    }

    if (withDatabase) {
      const db = await DatabaseService.getConnection();
      try {
        return await handler({ database: db }, ...args);
      } finally {
        db.release();
      }
    }

    return handler({ database: null }, ...args);
  };
}

export default RegisterService;
