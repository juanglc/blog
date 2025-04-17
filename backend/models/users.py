from bson import ObjectId

def user_schema(data):
    return {
        "_id": str(data.get("_id", ObjectId())),
        "nombre": data.get("nombre", ""),
        "correo": data.get("correo", ""),
        "rol": data.get("rol", ""),
    }