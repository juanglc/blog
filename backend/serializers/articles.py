def serialize_article_full(article, users_collection, tags_collection):
    try:
        # Get author information
        author = None
        if 'autor_id' in article:
            author = users_collection.find_one({"_id": article['autor_id']})

        # Handle tags directly from the article document
        tags_info = []
        if 'tags' in article and article['tags']:
            cursor = tags_collection.find({"_id": {"$in": article['tags']}})
            tags_info = [tag for tag in cursor]

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
        return result
    except Exception as e:
        print(f"Error serializing article: {e}")
        return None