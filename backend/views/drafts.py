from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from serializers.drafts import serialize_drafts_full
from datetime import datetime

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_drafts(request, autor_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        drafts = list(db.pending_articles.find({"borrador": True, "autor_id": autor_id}).sort('fecha_creacion', -1).skip(skip).limit(per_page))
        total_drafts = db.pending_articles.count_documents({"borrador": True, "autor_id": autor_id})

        if not drafts:
            return Response({
                "drawers": [],
                "pagination": {
                    "total": total_drafts,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_drafts + per_page - 1) // per_page
                }
            })

        enriched = []
        for draft in drafts:
            serialized = serialize_drafts_full(draft, db.users, db.tags)
            print(f"[DEBUG] Draft: {draft}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)

        return Response({
            "drawers": enriched,
            "pagination": {
                "total": total_drafts,
                "page": page,
                "per_page": per_page,
                "pages": (total_drafts + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener los borradores: {e}")
        return JsonResponse({"error": "Error al obtener los borradores"}, status=500)

@api_view(['GET'])
def get_draft_by_id(request, draft_id):
    try:
        draft = db.pending_articles.find_one({"_id": draft_id})
        if not draft:
            return None
        serialized = serialize_drafts_full(draft, db.users, db.tags)
        return Response(serialized)
    except Exception as e:
        print(f"[ERROR] Error al obtener el borrador: {e}")
        return None

@api_view(['PUT'])
def update_draft(request, draft_id):
    try:
        print(f"[DEBUG] Updating draft {draft_id}")
        draft = db.pending_articles.find_one({"_id": draft_id, "borrador": True})
        if not draft:
            return Response({"error": "Draft not found or is not a draft"}, status=404)

        data = request.data
        print(f"[DEBUG] Received update data: {data}")

        updates = {}

        # Only update fields that have changed
        if 'titulo' in data and data['titulo'] != draft.get('titulo'):
            updates['titulo'] = data['titulo']
            print(f"[DEBUG] Updating titulo: {data['titulo']}")

        if 'contenido_markdown' in data and data['contenido_markdown'] != draft.get('contenido_markdown'):
            updates['contenido_markdown'] = data['contenido_markdown']
            print(f"[DEBUG] Updating contenido_markdown")

        if 'imagen_url' in data and data['imagen_url'] != draft.get('imagen_url'):
            updates['imagen_url'] = data['imagen_url']
            print(f"[DEBUG] Updating imagen_url: {data['imagen_url']}")

        if 'tags' in data:
            updates['tags'] = data['tags']
            print(f"[DEBUG] Updating tags directly: {data['tags']}")

        if 'descripcion' in data and data['descripcion'] != draft.get('descripcion'):
            updates['descripcion'] = data['descripcion']
            print(f"[DEBUG] Updating descripcion: {data['descripcion']}")

        # Always update fecha_actualizacion field
        current_time = datetime.now().isoformat()
        updates['fecha_actualizacion'] = current_time
        print(f"[DEBUG] Setting fecha_actualizacion: {current_time}")

        # Only perform update if there are changes
        if updates:
            print(f"[DEBUG] Performing update with fields: {list(updates.keys())}")
            result = db.pending_articles.update_one(
                {"_id": draft_id, "borrador": True},
                {"$set": updates}
            )
            print(f"[DEBUG] Update result: {result.modified_count} document(s) modified")

            # Verify the update
            updated_draft = db.pending_articles.find_one({"_id": draft_id, "borrador": True})
            print(f"[DEBUG] Updated draft fecha_actualizacion: {updated_draft.get('fecha_actualizacion', 'Not found')}")

            return Response({
                "message": "Draft updated successfully",
                "updated_fields": list(updates.keys()),
                "fecha_actualizacion": updates['fecha_actualizacion']
            })
        else:
            print("[DEBUG] No changes detected")
            return Response({"message": "No changes to update"})

    except Exception as e:
        print(f"[ERROR] Exception in update_draft: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def push_draft(request, draft_id):
    try:
        print(f"[DEBUG] Pushing draft {draft_id}")

        # Find the draft in the database
        draft = db.pending_articles.find_one({"_id": draft_id, "borrador": True})
        if not draft:
            return Response({"error": "Draft not found or is not a draft"}, status=404)

        # Update the draft to remove the 'borrador' flag
        result = db.pending_articles.update_one(
            {"_id": draft_id, "borrador": True},
            {"$set": {"borrador": False}}
        )

        if result.modified_count == 1:
            # Create an article request based on the draft
            article_request = {
                "_id": f"req{int(datetime.utcnow().timestamp())}",  # Generate a unique ID
                "autor_id": draft.get("autor_id"),
                "tipo": draft.get("tipo"),
                "id_articulo_nuevo": draft.get("_id"),  # Use the draft's ID as the new article ID
                "id_articulo_original": draft.get("id_articulo_original", None),  # Default to None if not present
                "estado": "pendiente",
                "fecha": datetime.utcnow(),
            }

            # Insert the article request into the database
            db.article_requests.insert_one(article_request)

            return Response({
                "message": "Draft pushed and article request created successfully",
                "article_request": article_request
            }, status=201)
        else:
            return Response({"error": "Failed to push the draft"}, status=500)

    except Exception as e:
        print(f"[ERROR] Exception in push_draft: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['DELETE'])
def delete_draft(request, draft_id):
    try:
        print(f"[DEBUG] Deleting draft {draft_id}")
        result = db.pending_articles.delete_one({"_id": draft_id, "borrador": True})

        if result.deleted_count == 1:
            return Response({"message": "Draft deleted successfully"})
        else:
            return Response({"error": "Draft not found or is not a draft"}, status=404)

    except Exception as e:
        print(f"[ERROR] Exception in delete_draft: {e}")
        return Response({"error": str(e)}, status=500)