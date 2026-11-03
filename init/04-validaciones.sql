CREATE TABLE IF NOT EXISTS validaciones (
    id SERIAL PRIMARY KEY,
    propuesta_id VARCHAR(255) NOT NULL,
    entregable_id VARCHAR(255),
    resultado VARCHAR(50) NOT NULL,
    observaciones TEXT,
    fecha_validacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
