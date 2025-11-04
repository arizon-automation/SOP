/**
 * 数据库连接池配置
 * 复用arizon-one-v3的db.ts逻辑
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

// 慢查询阈值
const SLOW_QUERY_THRESHOLD = 1000; // ms

export function getDb(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // 最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000, // 30秒查询超时
      ssl: {
        rejectUnauthorized: false, // Neon需要SSL
      },
    });

    // 池错误处理
    pool.on('error', (err) => {
      console.error('🔴 数据库连接池错误:', err);
    });

    console.log('✅ 数据库连接池已创建');
  }
  return pool;
}

/**
 * 执行查询并监控性能
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getDb();
  const start = Date.now();
  
  try {
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    
    // 警告慢查询
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`⚠️ 慢查询 (${duration}ms):`, text.substring(0, 100));
    }
    
    return res;
  } catch (error: any) {
    console.error('❌ 数据库查询错误:', {
      error: error.message,
      query: text.substring(0, 100),
    });
    throw error;
  }
}

/**
 * 获取客户端用于事务
 */
export async function getClient(): Promise<PoolClient> {
  const db = getDb();
  return await db.connect();
}

/**
 * 在事务中执行查询
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 批量插入助手
 */
export async function batchInsert(
  table: string,
  columns: string[],
  rows: any[][],
  conflictClause?: string
): Promise<void> {
  if (rows.length === 0) return;

  const placeholders: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const row of rows) {
    const rowPlaceholders = columns.map(() => `$${paramIndex++}`);
    placeholders.push(`(${rowPlaceholders.join(', ')})`);
    values.push(...row);
  }

  const onConflict = conflictClause || '';
  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${placeholders.join(', ')}
    ${onConflict}
  `;

  await query(sql, values);
}

/**
 * 关闭连接池（用于脚本）
 */
export async function end(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ 数据库连接池已关闭');
  }
}

export default { query, getClient, transaction, batchInsert, end };

