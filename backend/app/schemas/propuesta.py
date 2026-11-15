from datetime import datetime
from pydantic import BaseModel, Field

# Esquema para recibir los datos desde el frontend
class PropuestaCreate(BaseModel):
    titulo: str = Field(..., min_length=3, description="Título de la propuesta")
    memorista: str = Field(..., min_length=2)
    rut: str = Field(..., min_length=1)
    rol_usm: str = Field(..., min_length=1)
    celular: str = Field(..., min_length=1)
    campus: str = Field(..., min_length=1)
    modalidad: str = Field(..., min_length=1)
    profesor: str = Field(..., min_length=2)
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