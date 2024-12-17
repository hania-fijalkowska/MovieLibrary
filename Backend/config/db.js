const mysql = require('mysql2');
require('dotenv').config(); // loads variables from .env file

// create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

module.exports = pool.promise();
