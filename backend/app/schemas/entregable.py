from datetime import datetime
from typing import List
from pydantic import BaseModel, Field

# Esquema para recibir feedback del profesor guía y co-guía (HU-05 / HU-06)
class ComentarioCreate(BaseModel):
    autor_nombre: str = Field(..., min_length=2)
    contenido: str = Field(..., min_length=5)

# Esquema para serializar los comentarios
class ComentarioResponse(BaseModel):
    id: int
    entregable_id: int
    autor_nombre: str
    rol: str
    contenido: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# Esquema para responder la información del entregable (HU-04)
class EntregableResponse(BaseModel):
    id: int
    propuesta_id: int
    etapa: str
    nombre_archivo: str
    estado: str
    fecha_subida: datetime
    comentarios: List[ComentarioResponse] = []

    class Config:
        from_attributes = True