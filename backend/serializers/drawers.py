def serialize_drawer_full(drawer, users_collections, tags_collection):
    print("[DEBUG] ====== SERIALIZANDO DRAWER ======")
    print(f"[DEBUG] Drawer recibido: {drawer}")

    # Get author information
    author = None
    if 'autor_id' in drawer:
        author = users_collections.find_one({"_id": drawer['autor_id']})
        print(f"[DEBUG] Autor encontrado: {author}")
    else:
        print(f"[DEBUG] Autor no encontrado")
    # Handle tags directly from the drawer document
    tags_info = []
    if 'tags' in drawer and drawer['tags']:
        print(f"[DEBUG] Tags en el drawer: {drawer['tags']}")
        tags_info = drawer['tags']  # Use tags directly as stored in the drawer
    else:
        print(f"[DEBUG] Tags no encontrados")

    # Format the drawer with the enriched information
    result = {
        "id": drawer["_id"],
        "titulo": drawer.get("titulo", ""),
        "contenido_markdown": drawer.get("contenido_markdown", ""),
        "imagen_url": drawer.get("imagen_url", ""),
        "tags": tags_info,  # Use the tags directly
        "autor": author.get("nombre") if author else "",
        "autor_id": drawer.get("autor_id", ""),
        "fecha_creacion": drawer.get("fecha_creacion", ""),
        "descripcion": drawer.get("descripcion", ""),
    }

    print(f"[DEBUG] Resultado serializado: {result}")
    print("[DEBUG] ====== FIN SERIALIZACIÓN ======")
    return result