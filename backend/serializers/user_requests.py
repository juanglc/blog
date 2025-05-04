# backend/serializers/user_requests.py
def serialize_full_user_requests(request, users_collection):
    print(f"[DEBUG] ========= SERIALIZANDO REQUEST =========")
    print(f"[DEBUG] Artículo recibido: {request}")

    # Get user information
    user = None
    if 'user_id' in request:
        user = users_collection.find_one({"_id": request['user_id']})
        if user:
            print(f"[DEBUG] Usuario Encontrado")
        else:
            print(f"[DEBUG] Usuario no encontrado en la base de datos")

    # Create the serialized result
    result = {
        "_id": request.get("_id"),
        "id_usuario": request.get("user_id"),
        "usuario": user.get("nombre") if user else "Usuario no encontrado",
        "rol_actual": user.get("rol") if user else "desconocido",
        "rol_deseado": request.get("rol_deseado"),
        "estado": request.get("estado"),
        "fecha": request.get("fecha")
    }

    print(f"[DEBUG] Resultado serializado: {result}")
    print(f"[DEBUG] ========= FIN SERIALIZACIÓN =========")
    return result