def serialize_drafts_full(draft, users_collections, tags_collection):
    try:
        author = None
        if 'autor_id' in draft:
            author = users_collections.find_one({"_id": draft['autor_id']})

        # Handle tags directly from the drawer document
        tags_info = []
        if 'tags' in draft and draft['tags']:
            cursor = tags_collection.find({"_id": {"$in": draft['tags']}})
            tags_info = [tag for tag in cursor]

        # Format the drawer with the enriched information
        result = {
            "_id": draft["_id"],  # Changed from "id" to "_id" to match expected field
            "titulo": draft.get("titulo", ""),
            "contenido_markdown": draft.get("contenido_markdown", ""),
            "imagen_url": draft.get("imagen_url", ""),
            "tags": tags_info,  # Use the tags directly
            "autor": author.get("nombre") if author else "",
            "autor_id": draft.get("autor_id", ""),
            "fecha_creacion": draft.get("fecha_creacion", ""),
            "fecha_actualizacion": draft.get("fecha_actualizacion", ""), # Added this field
            "descripcion": draft.get("descripcion", ""),
            "tipo": draft.get("tipo", "nuevo"),  # Added this field
            "borrador": draft.get("borrador", True),  # Added this field
            "id_articulo_original": draft.get("id_articulo_original", ""),  # Added this field
        }
        return result
    except Exception as e:
        print(f"Error serializing draft: {e}")
        return None