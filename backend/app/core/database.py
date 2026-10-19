import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Configuración de conexión usando las credenciales habituales del docker-compose
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@db:5432/memorias_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_propuesta_columns():
    columns = {
        "memorista": "VARCHAR(150) NOT NULL DEFAULT ''",
        "rut": "VARCHAR(20) NOT NULL DEFAULT ''",
        "rol_usm": "VARCHAR(30) NOT NULL DEFAULT ''",
        "celular": "VARCHAR(30) NOT NULL DEFAULT ''",
        "campus": "VARCHAR(100) NOT NULL DEFAULT ''",
        "modalidad": "VARCHAR(100) NOT NULL DEFAULT ''",
        "profesor": "VARCHAR(150) NOT NULL DEFAULT ''",
    }
    with engine.begin() as connection:
        for column, definition in columns.items():
            connection.execute(
                text(
                    f"ALTER TABLE propuestas ADD COLUMN IF NOT EXISTS "
                    f"{column} {definition}"
                )
            )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()