from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.core.database import Base

class Propuesta(Base):
    __tablename__ = "propuestas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    resumen = Column(Text, nullable=False)
    problema_ingenieria = Column(Text, nullable=False)
    objetivos = Column(Text, nullable=False)
    bibliografia = Column(Text, nullable=False)
    estado = Column(String(50), default="En revisión")
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())