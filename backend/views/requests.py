# backend/views/requests.py
from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from serializers.user_requests import serialize_full_requests

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_requests(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        total_user_requests = db.user_requests.count_documents({})
        user_requests = list(db.user_requests.find().sort('fecha', -1).skip(skip).limit(per_page))

        if not user_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_user_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_user_requests + per_page - 1) // per_page
                }
            })

        # Add debugging to see exactly what's happening
        enriched = []
        for req in user_requests:
            serialized = serialize_full_requests(req, db.users)
            print(f"[DEBUG] Request: {req}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)

        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_user_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_user_requests + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes"}, status=500)