from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.core.database import Base

class Propuesta(Base):
    __tablename__ = "propuestas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    memorista = Column(String(150), nullable=False)
    rut = Column(String(20), nullable=False)
    rol_usm = Column(String(30), nullable=False)
    celular = Column(String(30), nullable=False)
    campus = Column(String(100), nullable=False)
    modalidad = Column(String(100), nullable=False)
    profesor = Column(String(150), nullable=False)
    resumen = Column(Text, nullable=False)
    problema_ingenieria = Column(Text, nullable=False)
    objetivos = Column(Text, nullable=False)
    bibliografia = Column(Text, nullable=False)
    estado = Column(String(50), default="En revisión")
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())