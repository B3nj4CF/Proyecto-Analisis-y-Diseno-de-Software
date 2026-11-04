ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS nombre_archivo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ruta_archivo VARCHAR(255);

CREATE TABLE IF NOT EXISTS evaluaciones_propuestas (
    id SERIAL PRIMARY KEY,
    propuesta_id INTEGER NOT NULL REFERENCES propuestas(id) ON DELETE CASCADE,
    evaluador_nombre VARCHAR(150) NOT NULL,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 0 AND 100),
    comentarios TEXT NOT NULL,
    confirmacion_reprobacion BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
