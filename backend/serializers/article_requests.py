def serialize_full_article_requests(request, users_collection, pa_collection, a_collection):
    print(f"[DEBUG] ========= SERIALIZANDO REQUEST =========")
    print(f"[DEBUG] Request recibido: {request}")

    user = None
    if 'autor_id' in request:
        user = users_collection.find_one({"_id": request['autor_id']})
        if user:
            user_name = user.get("nombre", "")
            print(f"[DEBUG] Usuario Encontrado")
    else:
        print(f"[DEBUG] Usuario no encontrado")

    u_article = None
    if 'id_articulo_nuevo' in request:
        u_article = pa_collection.find_one({"_id": request['id_articulo_nuevo']})
        if u_article:
            u_article_name = u_article.get("titulo", "")
            print(f"[DEBUG] Artículo encontrado: {u_article_name}, ID: {u_article['_id']}")
    else:
        print(f"[DEBUG] Artículo no encontrado")


    o_article = None
    if 'id_articulo_original' in request:
        o_article = a_collection.find_one({"_id": request['id_articulo_original']})
        if o_article:
            o_article_name = o_article.get("titulo", "")
            print(f"[DEBUG] Artículo encontrado: {o_article_name}, ID: {o_article['_id']}")
    else:
        print(f"[DEBUG] Artículo no encontrado")

    # Create the serialized result
    result = {
        "_id": request.get("_id"),
        "autor_id": request.get("autor_id"),
        "autor": user_name if user else "",
        "tipo": request.get("tipo"),
        "id_articulo_nuevo": request.get("id_articulo_nuevo"),
        "articulo_nuevo": u_article_name if u_article else "",
        "id_articulo_original": request.get("id_articulo_original"),
        "articulo_original": o_article_name if o_article else None,
        "estado": request.get("estado"),
        "fecha": request.get("fecha"),
    }

    print(f"[DEBUG] Resultado serializado: {result}")
    print(f"[DEBUG] ========= FIN SERIALIZACIÓN =========")
    return result