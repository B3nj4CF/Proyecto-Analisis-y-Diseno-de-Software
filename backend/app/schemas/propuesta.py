from datetime import datetime
from pydantic import BaseModel, Field

# Esquema para recibir los datos desde el frontend
class PropuestaCreate(BaseModel):
    titulo: str = Field(..., min_length=3, description="Título de la propuesta")
    resumen: str = Field(..., min_length=10, description="Resumen general")
    problema_ingenieria: str = Field(..., min_length=10, description="Problema complejo de ingeniería")
    objetivos: str = Field(..., min_length=10, description="Objetivos del trabajo")
    bibliografia: str = Field(..., min_length=5, description="Referencias bibliográficas")

# Esquema para responderle al frontend
class PropuestaResponse(PropuestaCreate):
    id: int
    estado: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True