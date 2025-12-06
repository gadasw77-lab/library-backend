const mysql = require('mysql2');

console.log('🔧 Connecting to database...');

// HARDCODED for Railway (REPLACE WITH YOUR VALUES)
const pool = mysql.createPool({
    host: 'shinkansen.proxy.rlwy.net',  // ← Change this
    user: 'root',
    password: 'mrhQxSUZZVDUJLEmkelODrepUxMJoMyF',  // ← Change this
    database: 'railway',
    port: 11986,  // ← Change this (e.g., 6543)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully!');
        connection.release();
    }
});

module.exports = promisePool;