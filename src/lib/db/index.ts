import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://localhost:5432/agency_os';

// Maintain a single pool instance across Next.js fast-refresh cycles
declare global {
  var __agency_pg_pool: Pool | undefined;
}

export const pool: Pool =
  globalThis.__agency_pg_pool ||
  new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__agency_pg_pool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`[db:slow_query] ${duration}ms: ${text.slice(0, 80)}...`);
    }
    return res;
  } catch (error) {
    console.error('[db:query_error]', { text, error });
    throw error;
  }
}

export async function testConnection(): Promise<{
  connected: boolean;
  database?: string;
  user?: string;
  version?: string;
  tablesCount?: number;
  error?: string;
}> {
  try {
    const infoRes = await query<{
      db: string;
      usr: string;
      ver: string;
    }>(
      'SELECT current_database() as db, current_user as usr, version() as ver'
    );
    const tablesRes = await query<{ count: string }>(
      "SELECT count(*)::text as count FROM information_schema.tables WHERE table_schema = 'public'"
    );

    return {
      connected: true,
      database: infoRes.rows[0]?.db,
      user: infoRes.rows[0]?.usr,
      version: infoRes.rows[0]?.ver,
      tablesCount: parseInt(tablesRes.rows[0]?.count || '0', 10),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      error: message,
    };
  }
}
