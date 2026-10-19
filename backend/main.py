import os
import shutil
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.database import engine, Base, get_db, ensure_propuesta_columns
from app.models.propuesta import Propuesta
from app.models.entregable import Entregable, ComentarioEntregable, EvaluacionEntregable
from app.schemas.propuesta import PropuestaCreate, PropuestaResponse
from app.schemas.entregable import EntregableResponse, ComentarioCreate, ComentarioResponse
from app.schemas.evaluacion import EvaluacionCreate, EvaluacionResponse

# Carpeta local para almacenar los archivos subidos
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Crea automáticamente las nuevas tablas en PostgreSQL al levantar
Base.metadata.create_all(bind=engine)
ensure_propuesta_columns()

app = FastAPI(title="Sistema de Gestión de Memorias")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"mensaje": "Backend de Sistema de Memorias funcionando"}

# -------------------------------------------------------------
# HU-01: Gestión de Propuestas
# -------------------------------------------------------------
@app.post(
    "/api/propuestas", 
    response_model=PropuestaResponse, 
    status_code=status.HTTP_201_CREATED, 
    tags=["HU-01: Propuestas"]
)
def crear_propuesta(datos: PropuestaCreate, db: Session = Depends(get_db)):
    nueva_propuesta = Propuesta(
        titulo=datos.titulo,
        memorista=datos.memorista,
        rut=datos.rut,
        rol_usm=datos.rol_usm,
        celular=datos.celular,
        campus=datos.campus,
        modalidad=datos.modalidad,
        profesor=datos.profesor,
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

@app.get(
    "/api/propuestas", 
    response_model=List[PropuestaResponse], 
    tags=["HU-01: Propuestas"]
)
def listar_propuestas(db: Session = Depends(get_db)):
    return db.query(Propuesta).all()

# -------------------------------------------------------------
# HU-04: Subir Documento de Avance (Memorista)
# -------------------------------------------------------------
@app.post(
    "/api/entregables/upload", 
    response_model=EntregableResponse, 
    status_code=status.HTTP_201_CREATED, 
    tags=["F-02: Avances"]
)
def subir_documento_avance(
    propuesta_id: int = Form(...),
    etapa: str = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validar que exista la propuesta vinculada
    propuesta = db.query(Propuesta).filter(Propuesta.id == propuesta_id).first()
    if not propuesta:
        raise HTTPException(status_code=404, detail="La propuesta de memoria no existe.")

    # Guardar archivo físicamente en disco
    ruta_guardado = os.path.join(UPLOAD_DIR, archivo.filename)
    with open(ruta_guardado, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    nuevo_entregable = Entregable(
        propuesta_id=propuesta_id,
        etapa=etapa,
        nombre_archivo=archivo.filename,
        ruta_archivo=ruta_guardado,
        estado="Pendiente de Revisión"
    )
    db.add(nuevo_entregable)
    db.commit()
    db.refresh(nuevo_entregable)
    return nuevo_entregable

@app.get(
    "/api/entregables", 
    response_model=List[EntregableResponse], 
    tags=["F-02: Avances"]
)
def listar_entregables(db: Session = Depends(get_db)):
    return db.query(Entregable).all()


@app.post(
    "/api/entregables/{entregable_id}/evaluacion",
    response_model=EvaluacionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["HU-07: Evaluación"],
)
def evaluar_entregable(
    entregable_id: int,
    datos: EvaluacionCreate,
    db: Session = Depends(get_db),
):
    entregable = db.query(Entregable).filter(Entregable.id == entregable_id).first()
    if not entregable:
        raise HTTPException(status_code=404, detail="El entregable no existe.")
    if datos.nota < 70 and not datos.confirmacion_reprobacion:
        raise HTTPException(
            status_code=400,
            detail="Debe confirmar explícitamente una calificación menor a 70.",
        )

    evaluacion = EvaluacionEntregable(
        entregable_id=entregable_id,
        evaluador_nombre=datos.evaluador_nombre,
        nota=datos.nota,
        comentarios=datos.comentarios,
        confirmacion_reprobacion=datos.confirmacion_reprobacion,
    )
    entregable.estado = "Evaluado"
    db.add(evaluacion)
    db.commit()
    db.refresh(evaluacion)
    return evaluacion

# -------------------------------------------------------------
# HU-05: Registrar Retroalimentación de Avance (Profesor Guía)
# -------------------------------------------------------------
@app.post(
    "/api/entregables/{entregable_id}/feedback-guia", 
    response_model=ComentarioResponse, 
    status_code=status.HTTP_201_CREATED, 
    tags=["F-02: Avances"]
)
def registrar_feedback_guia(
    entregable_id: int,
    datos: ComentarioCreate,
    db: Session = Depends(get_db)
):
    entregable = db.query(Entregable).filter(Entregable.id == entregable_id).first()
    if not entregable:
        raise HTTPException(status_code=404, detail="El entregable no existe.")

    # El profesor guía actualiza el estado a 'Revisado'
    entregable.estado = "Revisado"

    nuevo_comentario = ComentarioEntregable(
        entregable_id=entregable_id,
        autor_nombre=datos.autor_nombre,
        rol="Profesor Guía",
        contenido=datos.contenido
    )
    db.add(nuevo_comentario)
    db.commit()
    db.refresh(nuevo_comentario)
    return nuevo_comentario

# -------------------------------------------------------------
# HU-06: Emitir Comentarios Técnicos (Co-guía / Mentor)
# -------------------------------------------------------------
@app.post(
    "/api/entregables/{entregable_id}/feedback-coguia", 
    response_model=ComentarioResponse, 
    status_code=status.HTTP_201_CREATED, 
    tags=["F-02: Avances"]
)
def registrar_feedback_coguia(
    entregable_id: int,
    datos: ComentarioCreate,
    db: Session = Depends(get_db)
):
    entregable = db.query(Entregable).filter(Entregable.id == entregable_id).first()
    if not entregable:
        raise HTTPException(status_code=404, detail="El entregable no existe.")

    # El co-guía agrega observaciones técnicas sin alterar el estado formal
    nuevo_comentario = ComentarioEntregable(
        entregable_id=entregable_id,
        autor_nombre=datos.autor_nombre,
        rol="Co-guía / Mentor",
        contenido=datos.contenido
    )
    db.add(nuevo_comentario)
    db.commit()
    db.refresh(nuevo_comentario)
    return nuevo_comentario