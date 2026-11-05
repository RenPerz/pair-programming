from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    rol = Column(String(20), default="estudiante")
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Clase(Base):
    __tablename__ = "clases"

    id = Column(Integer, primary_key=True, index=True)
    materia_codigo = Column(String(20), nullable=False)
    materia_nombre = Column(String(150), nullable=False)
    grupo = Column(String(10), default="1")
    codigo_acceso = Column(String(20), unique=True, index=True, nullable=False)
    docente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Inscripcion(Base):
    __tablename__ = "inscripciones"

    id = Column(Integer, primary_key=True, index=True)
    clase_id = Column(Integer, ForeignKey("clases.id"), nullable=False)
    estudiante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Publicacion(Base):
    __tablename__ = "publicaciones"

    id = Column(Integer, primary_key=True, index=True)
    clase_id = Column(Integer, ForeignKey("clases.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    contenido = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ===============================
# MODELOS HU-01: PIZARRA DE DUDAS
# ===============================
class PreguntaBackchannel(Base):
    __tablename__ = "preguntas_backchannel"

    id = Column(Integer, primary_key=True, index=True)
    clase_id = Column(Integer, ForeignKey("clases.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    contenido = Column(Text, nullable=False)
    es_anonimo = Column(Boolean, default=True)
    votos_count = Column(Integer, default=0)
    resuelta = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VotoPregunta(Base):
    __tablename__ = "votos_preguntas"

    id = Column(Integer, primary_key=True, index=True)
    pregunta_id = Column(Integer, ForeignKey("preguntas_backchannel.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint('pregunta_id', 'usuario_id', name='uq_voto_pregunta_usuario'),
    )

# ==========================================
# MODELO HU-02: MATCHMAKING PARA EQUIPOS
# ==========================================
class PerfilMatchmaking(Base):
    __tablename__ = "perfiles_matchmaking"

    id = Column(Integer, primary_key=True, index=True)
    clase_id = Column(Integer, ForeignKey("clases.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    rol_preferido = Column(String(100), nullable=False)  # Ej: Frontend, Backend, Base de Datos, Fullstack, Documentación
    habilidades = Column(String(255), nullable=True)     # Ej: React, Python, SQL, Docker
    disponibilidad = Column(String(100), nullable=False) # Mañanas, Tardes, Noches, Fines de semana
    estado = Column(String(50), default="Buscando equipo") # "Buscando equipo" | "Equipo completo"
    contacto = Column(String(150), nullable=True)        # Telegram, WhatsApp, Email alternativo
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('clase_id', 'usuario_id', name='uq_perfil_clase_usuario'),
    )