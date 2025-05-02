def serialize_full_pending_articles(pa, users_collection, tags_collection):
    print("[DEBUG] ====== SERIALIZANDO PENDING ARTICLE ======")
    print(f"[DEBUG] Pending Article recibido: {pa}")

    author = None
    if 'autor_id' in pa:
        author = users_collection.find_one({"_id": pa['autor_id']})
        print(f"[DEBUG] Autor encontrado: {author}")

    tags_info = []
    if 'tags' in pa and pa['tags']:
        print(f"[DEBUG] Tags en el draft: {pa['tags']}")
        cursor = tags_collection.find({"_id": {"$in": pa['tags']}})
        tags_info = [tag for tag in cursor]
    else:
        print(f"[DEBUG] Tags no encontrados")

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

    print(f"[DEBUG] Resultado serializado: {result}")
    print("[DEBUG] ====== FIN SERIALIZACIÓN ======")
    return result