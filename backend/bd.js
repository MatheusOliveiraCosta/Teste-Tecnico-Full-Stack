require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.BD_HOST || 'localhost',
    user: process.env.BD_USER || 'root',
    password: process.env.BD_PASSWORD || 'root',
    database: process.env.BD_NAME || 'testeFS',
    waitForConnections: true,
    connectionLimit:10,
});

module.exports = pool;