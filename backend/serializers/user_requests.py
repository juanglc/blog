# backend/serializers/user_requests.py
def serialize_full_user_requests(request, users_collection):

    user = None
    try:
        if 'user_id' in request:
            user = users_collection.find_one({"_id": request['user_id']})

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
        return result
    except Exception as e:
        print(f"Error serializing user request: {e}")
        return None