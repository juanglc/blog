def TagSerializer(tag):
    try:
        resultado = {
            "id": str(tag.get("_id")),
            "nombre": tag.get("nombre", ""),
            "descripcion": tag.get("descripcion", "")
        }
        return resultado
    except Exception as e:
        print(f"Error serializing tag: {e}")
        return None