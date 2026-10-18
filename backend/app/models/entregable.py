from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Entregable(Base):
    __tablename__ = "entregables"

    id = Column(Integer, primary_key=True, index=True)
    propuesta_id = Column(Integer, ForeignKey("propuestas.id"), nullable=False)
    etapa = Column(String(100), nullable=False)  # Ej: 'Definición', 'Avance 1', 'Validación'
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    estado = Column(String(50), default="Pendiente de Revisión")
    fecha_subida = Column(DateTime(timezone=True), server_default=func.now())

    comentarios = relationship("ComentarioEntregable", back_populates="entregable")


class ComentarioEntregable(Base):
    __tablename__ = "comentarios_entregables"

    id = Column(Integer, primary_key=True, index=True)
    entregable_id = Column(Integer, ForeignKey("entregables.id"), nullable=False)
    autor_nombre = Column(String(150), nullable=False)
    rol = Column(String(50), nullable=False)  # 'Profesor Guía' o 'Co-guía/Mentor'
    contenido = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    entregable = relationship("Entregable", back_populates="comentarios")