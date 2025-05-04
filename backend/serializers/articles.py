def serialize_article_full(article, users_collection, tags_collection):
    print("[DEBUG] ====== SERIALIZANDO ARTÍCULO ======")
    print(f"[DEBUG] Artículo recibido: {article}")

    # Get author information
    author = None
    if 'autor_id' in article:
        author = users_collection.find_one({"_id": article['autor_id']})
        print(f"[DEBUG] Autor encontrado: {author}")

    # Handle tags directly from the article document
    tags_info = []
    if 'tags' in article and article['tags']:
        print(f"[DEBUG] Tags en el artículo: {article['tags']}")
        cursor = tags_collection.find({"_id": {"$in": article['tags']}})
        tags_info = [tag for tag in cursor]
    else:
        print(f"[DEBUG] Tags no encontrados")

    # Format the article with the enriched information
    result = {
        "id": article["_id"],
        "titulo": article.get("titulo", ""),
        "contenido_markdown": article.get("contenido_markdown", ""),
        "imagen_url": article.get("imagen_url", ""),
        "tags": tags_info,  # Use the tags directly
        "autor": author.get("nombre") if author else "",
        "autor_id": article.get("autor_id", ""),
        "fecha_creacion": article.get("fecha_creacion", ""),
        "descripcion": article.get("descripcion", ""),
    }

    # Add fecha_actualizacion if it exists
    if "fecha_actualizacion" in article and article["fecha_actualizacion"]:
        result["fecha_actualizacion"] = article["fecha_actualizacion"]

    print(f"[DEBUG] Resultado serializado: {result}")
    print("[DEBUG] ====== FIN SERIALIZACIÓN ======")
    return result