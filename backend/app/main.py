from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, clases, preguntas, matchmaking

Base.metadata.create_all(bind=engine)

app = FastAPI(title="NexusEdu API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clases.router)
app.include_router(preguntas.router)
app.include_router(matchmaking.router)

@app.get("/")
def read_root():
    return {"message": "NexusEdu Backend activo"}