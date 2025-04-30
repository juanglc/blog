from datetime import datetime

def pending_articles_schema(data):
    return {
        "_id": str(data.get("_id")),
        "titulo": data.get("titulo"),
        "contenido_markdown": data.get("contenido_markdown"),
        "imagen_url": data.get("imagen_url"),
        "tags": [
            {
                "nombre": tag.get("nombre"),
                "descripcion": tag.get("descripcion")
            } for tag in data.get("tags", [])
        ],
        "autor_id": str(data.get("autor_id")),
        "fecha_creacion": data.get("fecha_creacion", datetime.utcnow()),
        "descripcion": data.get("descripcion"),
        "tipo": data.get("tipo"),
        "id_articulo_original": str(data.get("id_articulo_original")),
        "borrador": data.get("borrador", False),
        "estado": data.get("estado", "pendiente"),
        "fecha_envio": data.get("fecha_envio", datetime.utcnow())
    }