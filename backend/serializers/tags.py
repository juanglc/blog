def TagSerializer(tag):
    """
    Serializa un objeto de etiqueta (tag) para su representación JSON.

    Args:
        tag (dict): Objeto de etiqueta a serializar.

    Returns:
        dict: Objeto de etiqueta serializado.
    """
    print("\n[DEBUG] ====== SERIALIZANDO TAG ======")
    print(f"[DEBUG] Tag recibido: {tag}")

    resultado = {
        "id": str(tag.get("_id")),
        "nombre": tag.get("nombre", ""),
        "descripcion": tag.get("descripcion", "")
    }

    print(f"[DEBUG] Resultado serializado: {resultado}")
    print("[DEBUG] ====== FIN SERIALIZACIÓN ======\n")
    return resultado