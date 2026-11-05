from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Clase, Publicacion, Usuario

router = APIRouter(prefix="/clases", tags=["Clases"])

@router.get("/mis-clases/{usuario_id}")
def listar_todas_las_clases(usuario_id: int, db: Session = Depends(get_db)):
    # Filtrar estrictamente la asignatura oficial del sistema (ID: 1)
    clases = db.query(Clase).filter(Clase.id == 1).all()
    
    return [
        {
            "clase_id": c.id,
            "materia_codigo": c.materia_codigo,
            "materia_nombre": c.materia_nombre,
            "grupo": c.grupo
        }
        for c in clases
    ]

@router.get("/{clase_id}/detalle")
def obtener_detalle_clase(clase_id: int, db: Session = Depends(get_db)):
    clase = db.query(Clase).filter(Clase.id == clase_id).first()
    if not clase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase no encontrada"
        )

    docente = db.query(Usuario).filter(Usuario.id == clase.docente_id).first()
    publicaciones = (
        db.query(Publicacion)
        .filter(Publicacion.clase_id == clase_id)
        .order_by(Publicacion.created_at.desc())
        .all()
    )

    return {
        "id": clase.id,
        "materia": clase.materia_nombre,
        "codigo": clase.materia_codigo,
        "grupo": clase.grupo,
        "docente": docente.nombre_completo if docente else "Docente no asignado",
        "publicaciones": [
            {
                "id": p.id,
                "titulo": p.titulo,
                "contenido": p.contenido,
                "autor": docente.nombre_completo if docente else "Cátedra",
                "fecha": p.created_at.strftime("%d/%m/%Y") if p.created_at else ""
            }
            for p in publicaciones
        ]
    }