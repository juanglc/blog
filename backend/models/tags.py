from bson import ObjectId

def tag_schema(data):
    return {
        "_id": str(data.get("_id", ObjectId())),
        "nombre": data.get("nombre", ""),
        "descripcion": data.get("descripcion", ""),
    }