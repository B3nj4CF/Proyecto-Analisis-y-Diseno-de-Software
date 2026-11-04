const { Pool } = require('pg');

require('dotenv').config();

const database = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'validaciones_db',
    port: process.env.DB_PORT || 5432,
    host: process.env.DB_HOST || 'db_validaciones'
});

module.exports = database;