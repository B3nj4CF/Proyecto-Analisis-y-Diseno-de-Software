from datetime import datetime

from pydantic import BaseModel, Field


class EvaluacionCreate(BaseModel):
    evaluador_nombre: str = Field(..., min_length=2)
    nota: int = Field(..., ge=0, le=100)
    comentarios: str = Field(..., min_length=5)
    confirmacion_reprobacion: bool = False


class EvaluacionResponse(EvaluacionCreate):
    id: int
    entregable_id: int
    fecha_evaluacion: datetime

    class Config:
        from_attributes = True
