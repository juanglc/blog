from bson import ObjectId

def article_schema(data):
    return {
        "_id": str(data.get("_id", ObjectId())),
        "titulo": data.get("titulo", ""),
        "contenido_markdown": data.get("contenido_markdown", ""),
        "imagen_url": data.get("imagen_url", ""),
        "tags": data.get("tags", []),
        "autor_id": data.get("autor_id", ""),
        "fecha_creacion": data.get("fecha_creacion"),
        "descripcion": data.get("descripcion", ""),
    }