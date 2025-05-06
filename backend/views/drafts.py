from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from serializers.drafts import serialize_drafts_full
from datetime import datetime
from rest_framework import status

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_drafts(request, autor_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        drafts = list(db.pending_articles.find({"borrador": True, "autor_id": autor_id}).sort('fecha_creacion', -1).skip(skip).limit(per_page))
        total_drafts = len(drafts)

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
            enriched.append(serialized)

        return Response({
            "drafts": enriched,
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
        draft = db.pending_articles.find_one({"_id": draft_id, "borrador": True})
        if not draft:
            return Response({"error": "Draft not found or is not a draft"}, status=404)

        data = request.data

        updates = {}

        # Only update fields that have changed
        if 'titulo' in data and data['titulo'] != draft.get('titulo'):
            updates['titulo'] = data['titulo']

        if 'contenido_markdown' in data and data['contenido_markdown'] != draft.get('contenido_markdown'):
            updates['contenido_markdown'] = data['contenido_markdown']

        if 'imagen_url' in data and data['imagen_url'] != draft.get('imagen_url'):
            updates['imagen_url'] = data['imagen_url']

        # Transform tags from array of objects to array of strings
        if 'tags' in data:
            original_tags = data.get("tags", [])
            transformed_tags = []
            for tag in original_tags:
                if isinstance(tag, dict) and "_id" in tag:
                    transformed_tags.append(tag["_id"])
                elif isinstance(tag, str):
                    transformed_tags.append(tag)

            updates['tags'] = transformed_tags

        if 'descripcion' in data and data['descripcion'] != draft.get('descripcion'):
            updates['descripcion'] = data['descripcion']

        # Always update fecha_actualizacion field
        current_time = datetime.now().isoformat()
        updates['fecha_actualizacion'] = current_time

        # Only perform update if there are changes
        if updates:
            result = db.pending_articles.update_one(
                {"_id": draft_id, "borrador": True},
                {"$set": updates}
            )
            # Verify the update
            updated_draft = db.pending_articles.find_one({"_id": draft_id, "borrador": True})

            return Response({
                "message": "Draft updated successfully",
                "updated_fields": list(updates.keys()),
                "fecha_actualizacion": updates['fecha_actualizacion']
            })
        else:
            return Response({"message": "No changes to update"})

    except Exception as e:
        print(f"[ERROR] Exception in update_draft: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['PUT'])
def push_draft(request, draft_id):
    try:

        # Find the draft in the database
        draft = db.pending_articles.find_one({"_id": draft_id, "borrador": True})
        if not draft:
            return Response({"error": "Draft not found or is not a draft"}, status=404)

        # Update the draft to remove the 'borrador' flag
        db.pending_articles.update_one(
            {"_id": draft_id, "borrador": True},
            {"$set": {"borrador": False}}
        )
        return Response({"message": "Draft pushed successfully"})

    except Exception as e:
        print(f"[ERROR] Exception in push_draft: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['DELETE'])
def delete_draft(request, draft_id):
    try:
        result = db.pending_articles.delete_one({"_id": draft_id, "borrador": True})

        if result.deleted_count == 1:
            return Response({"message": "Draft deleted successfully"})
        else:
            return Response({"error": "Draft not found or is not a draft"}, status=404)

    except Exception as e:
        print(f"[ERROR] Exception in delete_draft: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def check_draft(request, id_original):
    try:
        # Find existing draft for this article
        draft = db.pending_articles.find_one({
            'id_articulo_original': id_original,
            'borrador': True
        })

        if draft:
            # Use str() to convert ObjectId to string explicitly
            draft_id = str(draft['_id'])
            return Response({"draft_id": draft_id}, status=status.HTTP_200_OK)
        else:
            return Response({"draft_id": None}, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        print(f"Error checking draft: {str(e)}")
        print(traceback.format_exc())  # Print full stack trace
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)