// MySQL connection pool (credentials come from environment variables)
import mysql from 'mysql2/promise';

function createPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });
}

const pool = globalThis._mysqlPool || createPool();
if (process.env.NODE_ENV !== 'production') globalThis._mysqlPool = pool;

export default pool;

// Run a single parameterised query and return the rows
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Run several statements in one transaction. `work` receives a connection.
export async function transaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
