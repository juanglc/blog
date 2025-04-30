from bson import ObjectId
from datetime import datetime

def requests_users_schema(data):
    return {
        "_id": str(data.get("_id")),
        "user_id": str(data.get("user_id", "")),
        "rol_deseado": data.get("rol_deseado", "escritor"),
        "estado": data.get("estado", "pendiente"),
        "fecha": data.get("fecha", datetime.utcnow())
    }

def request_update_schema(data):
    return {
        "_id": str(data.get("_id")),
        "author_id": str(data.get("autor_id")),
        "tipo": data.get("tipo"),
        "id_articulo_nuevo": str(data.get("id_articulo_nuevo")),
        "id_articulo_original": str(data.get("id_articulo_original")),
        "estado": data.get("estado"),
        "fecha": data.get("fecha"),
    }

def request_new_schema(data):
    return {
        "_id": str(data.get("_id")),
        "author_id": str(data.get("autor_id")),
        "tipo": data.get("tipo"),
        "id_articulo_nuevo": str(data.get("id_articulo_nuevo")),
        "estado": data.get("estado"),
        "fecha": data.get("fecha"),
    }