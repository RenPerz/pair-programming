from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.database import get_db
from app.models import PreguntaBackchannel, VotoPregunta, Usuario

router = APIRouter(prefix="/preguntas", tags=["HU-01: Backchannel de Preguntas"])

class CrearPreguntaRequest(BaseModel):
    clase_id: int
    autor_id: int
    contenido: str
    es_anonimo: bool = True

class ToggleVotoRequest(BaseModel):
    usuario_id: int

@router.get("/clase/{clase_id}")
def obtener_preguntas_clase(clase_id: int, usuario_id: Optional[int] = None, db: Session = Depends(get_db)):
    preguntas = (
        db.query(PreguntaBackchannel)
        .filter(PreguntaBackchannel.clase_id == clase_id)
        .order_by(PreguntaBackchannel.resuelta.asc(), desc(PreguntaBackchannel.votos_count), desc(PreguntaBackchannel.created_at))
        .all()
    )

    # Identificar qué preguntas votó el usuario actual
    votos_usuario = set()
    if usuario_id:
        votos = db.query(VotoPregunta.pregunta_id).filter(VotoPregunta.usuario_id == usuario_id).all()
        votos_usuario = {v[0] for v in votos}

    resultado = []
    for p in preguntas:
        autor_nombre = "Estudiante Anónimo"
        if not p.es_anonimo:
            autor = db.query(Usuario).filter(Usuario.id == p.autor_id).first()
            autor_nombre = autor.nombre_completo if autor else "Desconocido"

        resultado.append({
            "id": p.id,
            "contenido": p.contenido,
            "es_anonimo": p.es_anonimo,
            "autor": autor_nombre,
            "autor_id": p.autor_id,
            "votos_count": p.votos_count,
            "resuelta": p.resuelta,
            "ha_votado": p.id in votos_usuario,
            "created_at": p.created_at.strftime("%H:%M - %d/%m") if p.created_at else ""
        })

    return resultado

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_pregunta(datos: CrearPreguntaRequest, db: Session = Depends(get_db)):
    texto = datos.contenido.strip()
    if not texto:
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía.")

    nueva = PreguntaBackchannel(
        clase_id=datos.clase_id,
        autor_id=datos.autor_id,
        contenido=texto,
        es_anonimo=datos.es_anonimo,
        votos_count=0,
        resuelta=False
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return {"status": "success", "id": nueva.id}

@router.post("/{pregunta_id}/votar")
def toggle_voto(pregunta_id: int, datos: ToggleVotoRequest, db: Session = Depends(get_db)):
    pregunta = db.query(PreguntaBackchannel).filter(PreguntaBackchannel.id == pregunta_id).first()
    if not pregunta:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")

    voto_existente = db.query(VotoPregunta).filter(
        VotoPregunta.pregunta_id == pregunta_id,
        VotoPregunta.usuario_id == datos.usuario_id
    ).first()

    if voto_existente:
        # Si ya votó, retirar voto
        db.delete(voto_existente)
        pregunta.votos_count = max(0, pregunta.votos_count - 1)
        db.commit()
        return {"status": "success", "ha_votado": False, "votos": pregunta.votos_count}
    else:
        # Registrar voto
        nuevo_voto = VotoPregunta(pregunta_id=pregunta_id, usuario_id=datos.usuario_id)
        db.add(nuevo_voto)
        pregunta.votos_count += 1
        db.commit()
        return {"status": "success", "ha_votado": True, "votos": pregunta.votos_count}

class ResolverPreguntaRequest(BaseModel):
    usuario_id: int

@router.put("/{pregunta_id}/resolver")
def toggle_resolver(pregunta_id: int, datos: ResolverPreguntaRequest, db: Session = Depends(get_db)):
    pregunta = db.query(PreguntaBackchannel).filter(PreguntaBackchannel.id == pregunta_id).first()
    if not pregunta:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")

    # Verificar que el usuario que intenta resolver sea profesor
    usuario = db.query(Usuario).filter(Usuario.id == datos.usuario_id).first()
    if not usuario or usuario.rol != "profesor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el docente titular puede marcar una duda como resuelta."
        )

    pregunta.resuelta = not pregunta.resuelta
    db.commit()
    return {"status": "success", "resuelta": pregunta.resuelta}