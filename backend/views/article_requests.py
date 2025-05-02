# backend/views/article_requests.py
from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from serializers.article_requests import serialize_full_article_requests
from datetime import datetime
client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_article_requests(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        article_requests = list(db.article_requests.find().sort('fecha', -1).skip(skip).limit(per_page))
        total_article_requests = db.article_requests.count_documents({})

        if not article_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_article_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_article_requests + per_page - 1) // per_page
                }
            })

        # Add debugging to see exactly what's happening
        enriched = []
        for req in article_requests:
            serialized = serialize_full_article_requests(req, db.users, db.pending_articles, db.articles)
            print(f"[DEBUG] Request: {req}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)

        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_article_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_article_requests + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes"}, status=500)

@api_view(['GET'])
def get_active_article_requests(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        active_requests = list(db.article_requests.find({"estado": "pendiente"}).sort('fecha', -1).skip(skip).limit(per_page))
        total_active_requests = len(active_requests)
        if not active_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_active_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_active_requests + per_page - 1) // per_page
                }
            })

        enriched = []
        for req in active_requests:
            serialized = serialize_full_article_requests(req, db.users, db.pending_articles, db.articles)
            print(f"[DEBUG] Request: {req}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)
        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_active_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_active_requests + per_page - 1) // per_page
            }
        })

    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes activas: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes activas"}, status=500)

@api_view(['GET'])
def get_rejected_article_requests(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        rejected_requests = list(db.article_requests.find({"estado": "denegado"}).sort('fecha', -1).skip(skip).limit(per_page))
        total_rejected_requests = len(rejected_requests)
        if not rejected_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_rejected_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_rejected_requests + per_page - 1) // per_page
                }
            })

        enriched = []
        for req in rejected_requests:
            serialized = serialize_full_article_requests(req, db.users, db.pending_articles, db.articles)
            print(f"[DEBUG] Request: {req}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)
        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_rejected_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_rejected_requests + per_page - 1) // per_page
            }
        })

    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes rechazadas: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes activas"}, status=500)

@api_view(['GET'])
def get_article_request_by_id(request, request_id):
    try:
        request_data = db.article_requests.find_one({"_id": request_id})
        if not request_data:
            return JsonResponse({"error": "Solicitud no encontrada"}, status=404)

        serialized = serialize_full_article_requests(request_data, db.users, db.pending_articles, db.articles)
        return Response(serialized)
    except Exception as e:
        print(f"[ERROR] Error al obtener la solicitud: {e}")
        return JsonResponse({"error": "Error al obtener la solicitud"}, status=500)

@api_view(['GET'])
def get_approved_article_requests(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        approved_requests = list(db.article_requests.find({"estado": "aprobado"}).sort('fecha', -1).skip(skip).limit(per_page))
        total_approved_requests = len(approved_requests)
        if not approved_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_approved_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_approved_requests + per_page - 1) // per_page
                }
            })

        enriched = []
        for req in approved_requests:
            serialized = serialize_full_article_requests(req, db.users, db.pending_articles, db.articles)
            print(f"[DEBUG] Request: {req}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)
        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_approved_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_approved_requests + per_page - 1) // per_page
            }
        })

    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes aprobadas: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes aprobadas"}, status=500)

@api_view(['PUT'])
def approve_article_request(request, request_id):
    try:
        db.article_requests.update_one(
            {"_id": request_id},
            {"$set": {"estado": "aprobado"}}
        )
        return JsonResponse({"message": "Solicitud aprobada exitosamente", "tipo": f''}, status=200)

    except Exception as e:
        print(f"[ERROR] Error al aprobar la solicitud: {e}")
        return JsonResponse({"error": "Error al aprobar la solicitud"}, status=500)

@api_view(['PUT'])
def reject_article_request(request, request_id):
    try:
        db.article_requests.update_one(
            {"_id": request_id},
            {"$set": {"estado": "denegado"}}
        )
        return JsonResponse({"message": "Solicitud rechazada exitosamente"}, status=200)

    except Exception as e:
        print(f"[ERROR] Error al rechazar la solicitud: {e}")
        return JsonResponse({"error": "Error al rechazar la solicitud"}, status=500)