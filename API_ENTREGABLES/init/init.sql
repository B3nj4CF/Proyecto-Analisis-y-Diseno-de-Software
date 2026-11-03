CREATE TABLE IF NOT EXISTS entregables (
    id SERIAL PRIMARY KEY,
    propuesta_id VARCHAR(255) NOT NULL,
    etapa VARCHAR(100) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'En revisión',
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comentarios_entregables (
    id SERIAL PRIMARY KEY,
    entregable_id INTEGER NOT NULL REFERENCES entregables(id) ON DELETE CASCADE,
    autor_nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluaciones_entregables (
    id SERIAL PRIMARY KEY,
    entregable_id INTEGER NOT NULL REFERENCES entregables(id) ON DELETE CASCADE,
    evaluador_nombre VARCHAR(150) NOT NULL,
    nota INTEGER NOT NULL,
    comentarios TEXT NOT NULL,
    confirmacion_reprobacion BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);