def serialize_drafts_full(draft, users_collections, tags_collection):
    print("[DEBUG] ====== SERIALIZANDO DRAFT ======")
    print(f"[DEBUG] Draft recibido: {draft}")

    # Get author information
    author = None
    if 'autor_id' in draft:
        author = users_collections.find_one({"_id": draft['autor_id']})
        print(f"[DEBUG] Autor encontrado: {author}")
    else:
        print(f"[DEBUG] Autor no encontrado")
    # Handle tags directly from the drawer document
    tags_info = []
    if 'tags' in draft and draft['tags']:
        print(f"[DEBUG] Tags en el draft: {draft['tags']}")
        cursor = tags_collection.find({"_id": {"$in": draft['tags']}})
        tags_info = [tag for tag in cursor]
    else:
        print(f"[DEBUG] Tags no encontrados")

    # Format the drawer with the enriched information
    result = {
        "id": draft["_id"],
        "titulo": draft.get("titulo", ""),
        "contenido_markdown": draft.get("contenido_markdown", ""),
        "imagen_url": draft.get("imagen_url", ""),
        "tags": tags_info,  # Use the tags directly
        "autor": author.get("nombre") if author else "",
        "autor_id": draft.get("autor_id", ""),
        "fecha_creacion": draft.get("fecha_creacion", ""),
        "descripcion": draft.get("descripcion", ""),
    }

    print(f"[DEBUG] Resultado serializado: {result}")
    print("[DEBUG] ====== FIN SERIALIZACIÓN ======")
    return result