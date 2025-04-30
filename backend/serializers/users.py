def serialize_users_full(users):
    try:
        print(f"[DEBUG] ====== SERIALIZANDO USUARIOS ======")
        print(f"[DEBUG] Usuarios recibidos: {users}")
        # Assuming users is a list of user dictionaries
        result = {
            "id": users["_id"],
            "nombre": users.get("nombre", ""),
            "correo": users.get("correo", ""),
            "teléfono": users.get("telefono", None),
            "rol": users.get("rol", ""),
            "username": users.get("username", ""),
        }

        print(f"[DEBUG] Resultado serializado: {result}")
        print("[DEBUG] ====== FIN SERIALIZACIÓN ======")
        return result
    except Exception as e:
        print(f"[ERROR] Error al serializar los usuarios: {e}")
        return None