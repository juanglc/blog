from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from serializers.drafts import serialize_drafts_full

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_drafts(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        drafts = list(db.pending_articles.find({"borrador": True}).sort('fecha_creacion', -1).skip(skip).limit(per_page))
        total_drafts = db.pending_articles.count_documents({"borrador": True})

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

        # Process each draft individually
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