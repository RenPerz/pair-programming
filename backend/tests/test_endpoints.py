def test_root_backend(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "NexusEdu Backend activo"}

def test_catalogo_clases(client):
    response = client.get("/clases/mis-clases/1")
    assert response.status_code == 200
    datos = response.json()
    assert len(datos) > 0
    assert datos[0]["materia_nombre"] == "Programación"

def test_crear_pregunta_backchannel_hu01(client):
    payload = {
        "clase_id": 1,
        "autor_id": 1,
        "usuario_id": 1,
        "contenido": "¿Cuándo es la fecha de entrega del proyecto?",
        "texto": "¿Cuándo es la fecha de entrega del proyecto?",
        "es_anonimo": True,
        "anonimo": True
    }
    response = client.post("/preguntas/", json=payload)
    if response.status_code == 404:
        response = client.post("/preguntas", json=payload)
        
    assert response.status_code in [200, 201], f"Error devuelto por la API: {response.json()}"
    data = response.json()
    assert data.get("status") == "success" or "id" in data

def test_guardar_y_listar_matchmaking_hu02(client):
    payload = {
        "clase_id": 1,
        "usuario_id": 1,
        "rol_preferido": "Frontend Developer",
        "habilidades": "React, Tailwind",
        "disponibilidad": "Tardes",
        "estado": "Buscando equipo",
        "contacto": "@telegram_user"
    }
    res_post = client.post("/matchmaking/", json=payload)
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "success"

    res_get = client.get("/matchmaking/clase/1")
    assert res_get.status_code == 200
    perfiles = res_get.json()
    assert len(perfiles) == 1
    assert perfiles[0]["rol_preferido"] == "Frontend Developer"