import hashlib
from app.database import SessionLocal, engine, Base
from app.models import Usuario, Clase, Inscripcion, Publicacion

def hash_pass(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Asegurar Docente
        docente = db.query(Usuario).filter(Usuario.email == "docente@test.com").first()
        if not docente:
            docente = Usuario(
                nombre_completo="Profesor Demo",
                email="docente@test.com",
                hashed_password=hash_pass("password123"),
                rol="profesor",
                is_verified=True
            )
            db.add(docente)
            db.commit()
            db.refresh(docente)

        # 2. Asegurar Estudiante
        alumno = db.query(Usuario).filter(Usuario.email == "alumno@test.com").first()
        if not alumno:
            alumno = Usuario(
                nombre_completo="Estudiante Demo",
                email="alumno@test.com",
                hashed_password=hash_pass("password123"),
                rol="estudiante",
                is_verified=True
            )
            db.add(alumno)
            db.commit()
            db.refresh(alumno)

        materias = [
            ("SIS-201", "Estructura de Datos", "1", "ED201"),
            ("SIS-210", "Sistemas Operativos", "1", "SO210"),
            ("SIS-220", "Base de Datos I", "2", "BD220")
        ]

        usuarios = db.query(Usuario).all()

        for cod, nom, grp, acc in materias:
            clase = db.query(Clase).filter(Clase.materia_codigo == cod).first()
            if not clase:
                clase = Clase(
                    materia_codigo=cod,
                    materia_nombre=nom,
                    grupo=grp,
                    codigo_acceso=acc,
                    docente_id=docente.id
                )
                db.add(clase)
                db.commit()
                db.refresh(clase)

                db.add(Publicacion(
                    clase_id=clase.id,
                    autor_id=docente.id,
                    titulo=f"Bienvenida a {nom}",
                    contenido="Espacio oficial del curso. Consulta las novedades y participa en la pizarra de preguntas."
                ))

            # Inscribir a todos los usuarios registrados en esta materia
            for u in usuarios:
                existe_insc = db.query(Inscripcion).filter(
                    Inscripcion.clase_id == clase.id,
                    Inscripcion.estudiante_id == u.id
                ).first()
                if not existe_insc:
                    db.add(Inscripcion(clase_id=clase.id, estudiante_id=u.id, is_active=True))

        db.commit()
        print(">>> TODAS LAS CLASES E INSCRIPCIONES CONFIGURADAS <<<")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()