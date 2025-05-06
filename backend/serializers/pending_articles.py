def serialize_full_pending_articles(pa, users_collection, tags_collection):
    try:
        author = None
        if 'autor_id' in pa:
            author = users_collection.find_one({"_id": pa['autor_id']})
        tags_info = []
        if 'tags' in pa and pa['tags']:
            cursor = tags_collection.find({"_id": {"$in": pa['tags']}})
            tags_info = [tag for tag in cursor]

        result = {
            "_id": pa["_id"],
            "titulo": pa.get("titulo", ""),
            "descripcion": pa.get("descripcion", ""),
            "contenido_markdown": pa.get("contenido_markdown", ""),
            "imagen_url": pa.get("imagen_url", ""),
            "tags": tags_info,
            "autor": author.get("nombre") if author else "",
            "autor_id": pa.get("autor_id", ""),
            "fecha_creacion": pa.get("fecha_creacion", ""),
            "tipo": pa.get("tipo", ""),
            "estado": pa.get("estado", ""),
            "id_articulo_original": pa.get("id_articulo_original", "")
        }
        return result
    except Exception as e:
        print(f"Error serializing pending article: {e}")
        return None