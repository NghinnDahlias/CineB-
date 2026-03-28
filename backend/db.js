require('dotenv').config();
const sql = require('mssql');

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

function toBool(value, defaultValue) {
    if (value === undefined) return defaultValue;
    return ['1', 'true', 'yes', 'y'].includes(String(value).toLowerCase());
}

const dbConfig = {
    server: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    pool: {
        max: Number(process.env.DB_CONNECTION_LIMIT || 10),
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: toBool(process.env.DB_ENCRYPT, false),
        trustServerCertificate: toBool(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
        ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {})
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => pool)
    .catch(err => {
        console.error('SQL Server connection failed:', err.message);
        throw err;
    });

async function query(queryText, params = {}) {
    const pool = await poolPromise;
    const request = pool.request();

    if (Array.isArray(params)) {
        params.forEach((value, index) => {
            request.input(`p${index + 1}`, value);
        });
    } else {
        Object.entries(params).forEach(([name, value]) => {
            request.input(name, value);
        });
    }

    const result = await request.query(queryText);
    return [result.recordset, result];
}

module.exports = {
    sql,
    poolPromise,
    query
};