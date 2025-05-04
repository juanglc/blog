import datetime

from django.db.models.expressions import result
from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from serializers.pending_articles import serialize_full_pending_articles
from rest_framework.decorators import api_view
from rest_framework.response import Response

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_pending_articles_by_author(request, autor_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        pending_articles = list(db.pending_articles.find({"autor_id": autor_id, "borrador": False}).sort('fecha_creacion', -1).skip(skip).limit(per_page))
        total_pending_articles = db.pending_articles.count_documents({"autor_id": autor_id, "borrador": False})

        if not pending_articles:
            return Response({
                "pending_articles": [],
                "pagination": {
                    "total": total_pending_articles,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_pending_articles + per_page - 1) // per_page
                }
            })

        # Process each pending article individually
        enriched = []
        for pa in pending_articles:
            serialized = serialize_full_pending_articles(pa, db.users, db.tags)
            print(f"[DEBUG] Pending Article: {pa}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)

        return Response({
            "pending_articles": enriched,
            "pagination": {
                "total": total_pending_articles,
                "page": page,
                "per_page": per_page,
                "pages": (total_pending_articles + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener los artículos pendientes: {e}")
        return JsonResponse({"error": "Error al obtener los artículos pendientes"}, status=500)

@api_view(['GET'])
def get_pending_article_by_id(request, pending_article_id):
    try:
        pending_article = db.pending_articles.find_one({"_id": pending_article_id})
        if not pending_article:
            return Response({"error": "Artículo pendiente no encontrado"}, status=404)

        serialized = serialize_full_pending_articles(pending_article, db.users, db.tags)
        print(f"[DEBUG] Pending Article: {pending_article}")
        print(f"[DEBUG] Serialized: {serialized}")

        return Response(serialized)
    except Exception as e:
        print(f"[ERROR] Error al obtener el artículo pendiente: {e}")
        return JsonResponse({"error": "Error al obtener el artículo pendiente"}, status=500)

@api_view(['POST'])
def create_pending_article(request):
    try:
        data = request.data
        print(f"[DEBUG] Datos recibidos para crear un artículo pendiente o borrador: {data}")

        # Find all documents and determine the highest ID number
        all_articles = list(db.pending_articles.find(
            {"_id": {"$regex": "^pa\\d+$"}},
            {"_id": 1}
        ))

        # Extract numbers from IDs and find the maximum
        max_num = 0
        for article in all_articles:
            try:
                id_parts = article["_id"].split("pa")
                if len(id_parts) >= 2:
                    num = int(id_parts[1])
                    if num > max_num:
                        max_num = num
            except (ValueError, IndexError):
                continue

        # Increment the maximum number found
        next_num = max_num + 1

        # Create the ID with pa prefix and formatted with leading zeros
        article_id = f"pa{next_num:03d}"

        # Transform tags from array of objects to array of strings
        original_tags = data.get("tags", [])
        transformed_tags = []
        for tag in original_tags:
            if isinstance(tag, dict) and "_id" in tag:
                transformed_tags.append(tag["_id"])
            elif isinstance(tag, str):
                transformed_tags.append(tag)

        if data.get('tipo') == 'nuevo':
            new_pending_article = {
                "_id": article_id,
                "titulo": data.get("titulo"),
                "descripcion": data.get("descripcion"),
                "contenido_markdown": data.get("contenido_markdown"),
                "imagen_url": data.get("imagen_url"),
                "tags": transformed_tags,  # Using the transformed tags
                "autor_id": data.get("autor_id"),
                "fecha_creacion": datetime.datetime.now().isoformat(),
                "tipo": data.get("tipo"),
                "borrador": data.get("borrador", False),
                "estado": "pendiente",
            }
        else:
            new_pending_article = {
                "_id": article_id,
                "titulo": data.get("titulo"),
                "descripcion": data.get("descripcion"),
                "contenido_markdown": data.get("contenido_markdown"),
                "imagen_url": data.get("imagen_url"),
                "tags": transformed_tags,  # Using the transformed tags
                "autor_id": data.get("autor_id"),
                "fecha_creacion": data.get("fecha_creacion"),
                "tipo": data.get("tipo"),
                "borrador": data.get("borrador", False),
                "id_articulo_original": data.get("id_articulo_original"),
                "estado": "pendiente",
            }

        db.pending_articles.insert_one(new_pending_article)

        return Response({
            "message": "Artículo pendiente creado exitosamente",
            "pending_article": new_pending_article
        }, status=201)

    except Exception as e:
        import traceback
        print(f"[ERROR] Error al crear el artículo pendiente: {e}")
        print(traceback.format_exc())
        return JsonResponse({"error": f"Error al crear el artículo pendiente: {str(e)}"}, status=500)

@api_view(['PUT'])
def delete_pending_article(request, pa_id):
    try:
        # Attempt to find the pending article by ID
        pending_article = db.pending_articles.find_one({"_id": pa_id})
        if not pending_article:
            return Response({"error": "Pending article not found"}, status=404)

        # Update the estado field to "aprobado"
        db.pending_articles.update_one({"_id": pa_id}, {"$set": {"estado": "aprobado"}})
        return Response({"message": "Pending article deleted successfully"}, status=200)
    except Exception as e:
        print(f"[ERROR] Error deleting pending article: {e}")
        return JsonResponse({"error": "Error deleting pending article"}, status=500)

@api_view(['PUT'])
def pending_to_draft(request, pa_id):
    try:
        pending_article = db.pending_articles.find_one({"_id": pa_id})
        if not pending_article:
            return Response({"error": "Pending article not found"}, status=404)

        db.pending_articles.update_one({"_id": pa_id}, {"$set": {"borrador": True}})
        return Response({"message": "Pending article updated to draft successfully"}, status=200)

    except Exception as e:
        print(f"[ERROR] Error updating pending article to draft: {e}")
        return JsonResponse({"error": "Error updating pending article to draft"}, status=500)

@api_view(['GET'])
def check_pending_update(request, pending_article_id):
    try:
        # Buscar solo el _id del artículo con estado "pendiente"
        result = db.pending_articles.find_one(
            {"id_articulo_original": pending_article_id, "estado": "pendiente"},
            {"_id": 1}
        )

        if result:
            return JsonResponse({"error": "Ya existe una solicitud pendiente para este artículo"}, status=400)

        return JsonResponse({"message": "No hay solicitudes pendientes para este artículo"}, status=200)

    except Exception as e:
        print(f"[ERROR] Error al verificar artículo pendiente: {e}")
        return JsonResponse({"error": "Error del servidor"}, status=500)