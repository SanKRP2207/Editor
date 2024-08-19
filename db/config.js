const mysql = require('mysql');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

if (!process.env.TIDB_CA_PATH) {
    throw new Error('TIDB_CA_PATH is not defined in the environment variables.');
}

const certPath = path.resolve(__dirname, process.env.TIDB_CA_PATH);

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dialect: 'mysql',
    ssl: process.env.TIDB_ENABLE_SSL === 'true' ? {
        minVersion: 'TLSv1.2',
        ca: fs.readFileSync(certPath)
    } : null,
});

conn.connect((err) => {
    if (err) {
        console.log("Error in DB connection:", err);
    } else {
        console.log("Database connected successfully");
    }
});

module.exports = { conn, certPath };
