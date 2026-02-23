import { Pool, types, PoolConfig } from 'pg';
import Parameter from './parameter.js';
import z from 'zod';
import env from '@/config/env.js';

const dbConfigSchema = z.object({
  user: z.string(),
  password: z.string(),
  host: z.string(),
  database: z.string(),
  port: z.number(),
  sslMode: z.boolean(),
});

const result = dbConfigSchema.safeParse({
  user: env.database.user,
  password: env.database.password,
  host: env.database.host,
  database: env.database.database,
  port: Number(env.database.port),
  sslMode: env.database.sslMode,
});

if (!result.success) throw new Error('Invalid database ENV options in Database service');

const databaseConfig = result.data;


const dbConfig: PoolConfig = {
  user: databaseConfig.user,
  password: databaseConfig.password,
  host: databaseConfig.host,
  database: databaseConfig.database,
  port: databaseConfig.port,
  max: 80,

  connectionTimeoutMillis: 30000, // i.e. "connect_timeout" // (30 seconds X 1000 milliseconds)
  idleTimeoutMillis: 900000, // (15 minutes X 60 seconds X 1000 milliseconds)
  statement_timeout: 30000, // (30 seconds X 1000 milliseconds)
  query_timeout: 30000, // (30 seconds X 1000 milliseconds)
};

if (databaseConfig.sslMode) {
  dbConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(dbConfig);

// types.setTypeParser(1114, (dateStr) => new Date(`${dateStr} UTC`));
types.setTypeParser(1700, (val) => parseFloat(val));

// Type OID 1082 = DATE in PostgreSQL
types.setTypeParser(1082, (value) => value); // returns 'YYYY-MM-DD' string as-is

function convertNamedQueryToPositional(sqlStmt: string, params: object) {
  const values = [];
  const fields = [];
  let paramIndex = 1;

  const newQueryText = sqlStmt.replace(/\$\w+/g, (match: string) => {
    const paramName = match.substring(1); // Remove the $
    fields.push(paramName);
    values.push(params[paramName]);
    const result = `$${paramIndex}`;
    paramIndex += 1;
    return result;
  });

  return { sqlStmt: newQueryText, params: values };
}

function convertStringLiteralToQuery(strings: string[], ...values: any[]) {
  return {
    sqlStmt: strings.reduce((query: string, str: string, i: number) => query + str + (i < values.length ? `$${i + 1}` : ''), ''),
    params: values,
  };

}

async function getConnection() {
  const client = await pool.connect();
  let is_in_transaction = false;

  async function queryAll<T = any>(sqlStmt: string, params?: any[]): Promise<T[]> {
    const res = await client.query(sqlStmt, params);
    return res.rows;
  }

  async function queryOne<T = any>(sqlStmt: string, params?: any[]): Promise<T | null> {
    const res = await queryAll<T>(sqlStmt, params);
    return res[0];
  }

  async function namedQueryAll<T = any>(sqlStmt: string, params?: object): Promise<T[]> {
    const newQuery = convertNamedQueryToPositional(sqlStmt, params);
    const res = await queryAll<T>(newQuery.sqlStmt, newQuery.params);
    return res;
  }

  async function namedQueryOne<T = any>(sqlStmt: string, params?: object): Promise<T | null> {
    const res = await namedQueryAll<T>(sqlStmt, params);
    return res[0];
  }

  async function queryLiteralAll<T = any>(strings: string[], ...values: any[]): Promise<T[]> {
    const newQuery = convertStringLiteralToQuery(strings, ...values);
    const res = await queryAll<T>(newQuery.sqlStmt, newQuery.params);
    return res;
  }

  async function queryLiteralOne<T = any>(strings: string[], ...values: any[]): Promise<T | null> {
    const res = await queryLiteralAll<T>(strings, ...values);
    return res[0];
  }

  async function begin(){
    if (is_in_transaction) return;
    await client.query('BEGIN');
    is_in_transaction = true;
  }

  async function commit(){
    if (!is_in_transaction) return;
    await client.query('COMMIT');
    is_in_transaction = false;
  }

  async function rollback(){
    if (!is_in_transaction) return;
    await client.query('ROLLBACK');
    is_in_transaction = false;
  }

  const obj = {
    client,
    query: (sqlStmt: string, params?: any[]) => client.query(sqlStmt, params),
    release: () => client.release(),
    namedQueryAll,
    namedQueryOne,
    queryAll,
    queryOne,
    queryLiteralAll,
    queryLiteralOne,
    begin,
    commit,
    rollback,
  };

  return obj;
}


async function queryOne<T = any>(sqlStmt: string, params?: any[]): Promise<T | null> {
  const res = await pool.query<T>(sqlStmt, params);
  return res.rows[0];
}

async function queryAll<T = any>(sqlStmt: string, params?: any[]): Promise<T[]> {
  const res = await pool.query<T>(sqlStmt, params);
  return res.rows;
}

async function namedQueryAll<T = any>(sqlStmt: string, params?: object): Promise<T[]> {
  const newQuery = convertNamedQueryToPositional(sqlStmt, params);
  const res = await queryAll<T>(newQuery.sqlStmt, newQuery.params);
  return res;
}

async function namedQueryOne<T = any>(sqlStmt: string, params?: object): Promise<T | null> {
  const res = await namedQueryAll<T>(sqlStmt, params);
  return res[0];
}

export type DatabaseClient = Awaited<ReturnType<typeof getConnection>>;

export default {
  pool,
  getConnection,
  parameter: (): Parameter => new Parameter(),
  query: (sqlStmt: string, params?: any[]) => pool.query(sqlStmt, params),
  queryOne,
  queryAll,
  namedQueryAll,
  namedQueryOne
};
