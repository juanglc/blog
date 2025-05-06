def serialize_users_full(users):
    try:
        result = {
            "id": users["_id"],
            "nombre": users.get("nombre", ""),
            "correo": users.get("correo", ""),
            "teléfono": users.get("telefono", None),
            "rol": users.get("rol", ""),
            "username": users.get("username", ""),
        }
        return result
    except Exception as e:
        print(f"Error serializing user: {e}")
        return None