// db.js
const mysql = require('mysql2/promise');

let pool;

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,          // ex: gondola.proxy.rlwy.net
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,          // ex: 31380
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,              // 🔹 menjaga koneksi tetap hidup
    keepAliveInitialDelay: 0,           // 🔹 mulai keep-alive segera
    ssl: { rejectUnauthorized: false }, // 🔹 Railway butuh SSL
  });
}

if (!pool) {
  pool = createPool();
}

// 🔁 Auto reconnect jika koneksi terputus
pool.on('error', (err) => {
  console.error('⚠️  Database connection error:', err.code);
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
    console.log('🔄 Recreating MySQL pool...');
    pool = createPool();
  }
});

module.exports = pool;
