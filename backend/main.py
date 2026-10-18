from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import engine, Base, get_db
from app.models.propuesta import Propuesta
from app.schemas.propuesta import PropuestaCreate, PropuestaResponse

# Crea automáticamente la tabla en PostgreSQL al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Gestión de Memorias")

@app.get("/")
def read_root():
    return {"mensaje": "Backend de Sistema de Memorias funcionando"}

# HU-01: Endpoint para enviar y registrar la propuesta de tema
@app.post(
    "/api/propuestas", 
    response_model=PropuestaResponse, 
    status_code=status.HTTP_201_CREATED,
    tags=["Propuestas"]
)
def crear_propuesta(datos: PropuestaCreate, db: Session = Depends(get_db)):
    nueva_propuesta = Propuesta(
        titulo=datos.titulo,
        resumen=datos.resumen,
        problema_ingenieria=datos.problema_ingenieria,
        objetivos=datos.objetivos,
        bibliografia=datos.bibliografia,
        estado="En revisión"
    )
    db.add(nueva_propuesta)
    db.commit()
    db.refresh(nueva_propuesta)
    return nueva_propuesta

# Endpoint complementario para consultar todas las propuestas
@app.get(
    "/api/propuestas", 
    response_model=List[PropuestaResponse], 
    tags=["Propuestas"]
)
def listar_propuestas(db: Session = Depends(get_db)):
    propuestas = db.query(Propuesta).all()
    return propuestas