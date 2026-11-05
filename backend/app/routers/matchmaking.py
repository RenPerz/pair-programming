from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import PerfilMatchmaking, Usuario

router = APIRouter(prefix="/matchmaking", tags=["HU-02: Matchmaking Estudiantil"])

class GuardarPerfilRequest(BaseModel):
    clase_id: int
    usuario_id: int
    rol_preferido: str
    habilidades: Optional[str] = ""
    disponibilidad: str
    estado: str = "Buscando equipo"
    contacto: Optional[str] = ""

@router.post("", status_code=status.HTTP_200_OK)
@router.post("/", status_code=status.HTTP_200_OK)
def guardar_o_actualizar_perfil(datos: GuardarPerfilRequest, db: Session = Depends(get_db)):
    perfil = db.query(PerfilMatchmaking).filter(
        PerfilMatchmaking.clase_id == datos.clase_id,
        PerfilMatchmaking.usuario_id == datos.usuario_id
    ).first()

    if perfil:
        perfil.rol_preferido = datos.rol_preferido.strip()
        perfil.habilidades = (datos.habilidades or "").strip()
        perfil.disponibilidad = datos.disponibilidad.strip()
        perfil.estado = datos.estado.strip()
        perfil.contacto = (datos.contacto or "").strip()
    else:
        perfil = PerfilMatchmaking(
            clase_id=datos.clase_id,
            usuario_id=datos.usuario_id,
            rol_preferido=datos.rol_preferido.strip(),
            habilidades=(datos.habilidades or "").strip(),
            disponibilidad=datos.disponibilidad.strip(),
            estado=datos.estado.strip(),
            contacto=(datos.contacto or "").strip()
        )
        db.add(perfil)

    db.commit()
    db.refresh(perfil)
    return {"status": "success", "message": "Perfil guardado con éxito", "id": perfil.id}

@router.get("/clase/{clase_id}")
def listar_perfiles_clase(clase_id: int, rol: Optional[str] = None, estado: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PerfilMatchmaking).filter(PerfilMatchmaking.clase_id == clase_id)

    if rol and rol != "Todos":
        query = query.filter(PerfilMatchmaking.rol_preferido == rol)
    if estado and estado != "Todos":
        query = query.filter(PerfilMatchmaking.estado == estado)

    perfiles = query.order_by(PerfilMatchmaking.created_at.desc()).all()

    resultado = []
    for p in perfiles:
        estudiante = db.query(Usuario).filter(Usuario.id == p.usuario_id).first()
        resultado.append({
            "id": p.id,
            "usuario_id": p.usuario_id,
            "estudiante_nombre": estudiante.nombre_completo if estudiante else "Estudiante",
            "estudiante_email": estudiante.email if estudiante else "",
            "rol_preferido": p.rol_preferido,
            "habilidades": p.habilidades,
            "disponibilidad": p.disponibilidad,
            "estado": p.estado,
            "contacto": p.contacto,
        })
    return resultado

@router.get("/clase/{clase_id}/usuario/{usuario_id}")
def obtener_mi_perfil(clase_id: int, usuario_id: int, db: Session = Depends(get_db)):
    perfil = db.query(PerfilMatchmaking).filter(
        PerfilMatchmaking.clase_id == clase_id,
        PerfilMatchmaking.usuario_id == usuario_id
    ).first()
    if not perfil:
        return None
    return {
        "id": perfil.id,
        "rol_preferido": perfil.rol_preferido,
        "habilidades": perfil.habilidades,
        "disponibilidad": perfil.disponibilidad,
        "estado": perfil.estado,
        "contacto": perfil.contacto
    }