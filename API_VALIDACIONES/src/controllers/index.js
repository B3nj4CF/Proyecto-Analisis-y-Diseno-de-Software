const database = require('../db');


//Esta tabla es solo un ejemplo para que puedan ver como se hacen querys a la bdd, después puede ser eliminada
const createTable = async (req, res) => {
    try {
        await database.query(`
            CREATE TABLE IF NOT EXISTS validaciones (
                id SERIAL PRIMARY KEY,
                propuesta_id VARCHAR(255) NOT NULL,
                entregable_id VARCHAR(255),
                resultado VARCHAR(50) NOT NULL,
                observaciones TEXT,
                fecha_validacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        res.send('Tabla creada');
    } catch (error) {
        console.error('Error al crear la tabla de validaciones:', error);
        res.status(500).json({ error: 'No se pudo crear la tabla' });
    }
};


module.exports = {
    createTable
};