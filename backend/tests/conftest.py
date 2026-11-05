import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Asegurar path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.main import app
    from app.database import Base, get_db
    from app.models import Usuario, Clase
except ModuleNotFoundError:
    from main import app
    from database import Base, get_db
    from models import Usuario, Clase

# SQLite en memoria aislado
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # 1. Crear todas las tablas en la BD en memoria
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # 2. Insertar Usuario dinámicamente
    usuario = Usuario()
    usuario.id = 1
    usuario.nombre_completo = "Estudiante Demo"
    usuario.email = "demo@test.com"
    usuario.rol = "estudiante"

    # Rellenar cualquier columna NOT NULL restante (como la contraseña)
    for col in Usuario.__table__.columns:
        if not col.nullable and getattr(usuario, col.name) is None:
            if col.type.python_type is str:
                setattr(usuario, col.name, "pass123")
            elif col.type.python_type is int:
                setattr(usuario, col.name, 1)
            elif col.type.python_type is bool:
                setattr(usuario, col.name, True)

    session.add(usuario)
    session.commit()

    # 3. Insertar Clase dinámicamente
    clase = Clase()
    clase.id = 1
    clase.materia_codigo = "SIS-101"
    clase.materia_nombre = "Programación"
    clase.grupo = "1"

    # Rellenar cualquier columna NOT NULL restante de Clase
    for col in Clase.__table__.columns:
        if not col.nullable and getattr(clase, col.name) is None:
            if col.type.python_type is str:
                setattr(clase, col.name, "CODE123")
            elif col.type.python_type is int:
                setattr(clase, col.name, 1)
            elif col.type.python_type is bool:
                setattr(clase, col.name, True)

    session.add(clase)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()