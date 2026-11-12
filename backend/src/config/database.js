import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config({ quiet: true });

// Configuración del pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'la_clave',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
});

// Función para verificar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        return true;
    } catch (error) {
        logger.error('❌ Error al conectar con MySQL:', { error: error.message });
        return false;
    }
};

// Función helper para ejecutar queries
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        logger.error('Error en query:', { error: error.message });
        throw error;
    }
    };

// Función helper para transacciones
const transaction = async (callback) => {
    const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    };

export { pool, testConnection, query, transaction };
export default pool;