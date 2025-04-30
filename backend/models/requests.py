from bson import ObjectId
from datetime import datetime

def requests_users_schema(data):
    return {
        "_id": str(data.get("_id", ObjectId())),
        "user_id": data.get("user_id", ""),
        "rol_deseado": data.get("rol_deseado", "escritor"),
        "estado": data.get("estado", "pendiente"),
        "fecha": data.get("fecha", datetime.utcnow())
    }