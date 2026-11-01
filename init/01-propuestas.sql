CREATE TABLE IF NOT EXISTS propuestas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    memorista VARCHAR(150) NOT NULL,
    rut VARCHAR(20) NOT NULL,
    rol_usm VARCHAR(30) NOT NULL,
    celular VARCHAR(30) NOT NULL,
    campus VARCHAR(100) NOT NULL,
    modalidad VARCHAR(100) NOT NULL,
    profesor VARCHAR(150) NOT NULL,
    resumen TEXT NOT NULL,
    problema_ingenieria TEXT NOT NULL,
    objetivos TEXT NOT NULL,
    bibliografia TEXT NOT NULL,
    nombre_archivo VARCHAR(255),
    ruta_archivo VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'En revisión',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
