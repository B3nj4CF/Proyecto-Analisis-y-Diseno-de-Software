CREATE TABLE IF NOT EXISTS reportes_memoria (
    id SERIAL PRIMARY KEY,
    propuesta_id INTEGER NOT NULL UNIQUE CHECK (propuesta_id > 0),
    nota_escrita INTEGER CHECK (nota_escrita BETWEEN 0 AND 100),
    nota_oral INTEGER CHECK (nota_oral BETWEEN 0 AND 100),
    nota_final INTEGER GENERATED ALWAYS AS (
        ROUND(nota_escrita * 0.60 + nota_oral * 0.40)::INTEGER
    ) STORED,
    reporte_generado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_reporte TIMESTAMPTZ,
    pdf_snapshot BYTEA,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hu09_notas_pareadas CHECK (
        (nota_escrita IS NULL AND nota_oral IS NULL) OR
        (nota_escrita IS NOT NULL AND nota_oral IS NOT NULL)
    )
);
