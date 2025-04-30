from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from serializers.drawers import serialize_drawer_full

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_drawers(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        drawers = list(db.pending_articles.find({"borrador": True}).sort('fecha_creacion', -1).skip(skip).limit(per_page))
        total_drawers = db.pending_articles.count_documents({"borrador": True})

        if not drawers:
            return Response({
                "drawers": [],
                "pagination": {
                    "total": total_drawers,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_drawers + per_page - 1) // per_page
                }
            })

        # Add debugging to see exactly what's happening
        enriched = []
        for drawer in drawers:
            serialized = serialize_drawer_full(drawer, db.users, db.tags)
            print(f"[DEBUG] Drawer: {drawer}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)

        return Response({
            "drawers": enriched,
            "pagination": {
                "total": total_drawers,
                "page": page,
                "per_page": per_page,
                "pages": (total_drawers + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener los borradores: {e}")
        return JsonResponse({"error": "Error al obtener los borradores"}, status=500)

@api_view(['GET'])
def get_drawer_by_id(request, drawer_id):
    try:
        drawer = db.pending_articles.find_one({"_id": drawer_id})
        if not drawer:
            return None
        serialized = serialize_drawer_full(drawer, db.users, db.tags)
        return Response(serialized)
    except Exception as e:
        print(f"[ERROR] Error al obtener el borrador: {e}")
        return None