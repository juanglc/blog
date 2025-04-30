# backend/views/requests.py
from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from serializers.user_requests import serialize_full_user_requests

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_user_requests(request):
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
            serialized = serialize_full_user_requests(req, db.users)
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

@api_view(['GET'])
def get_active_user_requests(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        active_requests = list(db.user_requests.find({"estado": "pendiente"}).sort('fecha', -1).skip(skip).limit(per_page))
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

        # Add debugging to see exactly what's happening
        enriched = []
        for req in active_requests:
            serialized = serialize_full_user_requests(req, db.users)
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
def get_rejected_user_requests(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        rejected_requests = list(db.user_requests.find({"estado": "denegado"}).sort('fecha', -1).skip(skip).limit(per_page))
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
        # Add debugging to see exactly what's happening
        enriched = []
        for req in rejected_requests:
            serialized = serialize_full_user_requests(req, db.users)
            print(f"[DEBUG] Request: {req}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)
        return Response({
            "requests":  enriched,
            "pagination": {
                "total": total_rejected_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_rejected_requests + per_page - 1) // per_page
            }
        })

    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes rechazadas: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes rechazadas"}, status=500)

@api_view(['GET'])
def get_user_request_by_id(request, request_id):
    try:
        user_request = db.user_requests.find_one({"_id": request_id})
        if not user_request:
            return JsonResponse({"error": "Solicitud no encontrada"}, status=404)

        # Add debugging to see exactly what's happening
        serialized = serialize_full_user_requests(user_request, db.users)
        print(f"[DEBUG] Request: {user_request}")
        print(f"[DEBUG] Serialized: {serialized}")

        return JsonResponse(serialized)
    except Exception as e:
        print(f"[ERROR] Error al obtener la solicitud por ID: {e}")
        return JsonResponse({"error": "Error al obtener la solicitud"}, status=500)

@api_view(['GET'])
def get_approved_user_requests(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        approved_requests = list(db.user_requests.find({"estado": "aprobado"}).sort('fecha', -1).skip(skip).limit(per_page))
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
        # Add debugging to see exactly what's happening
        enriched = []
        for req in approved_requests:
            serialized = serialize_full_user_requests(req, db.users)
            print(f"[DEBUG] Request: {req}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)
        return Response({
            "requests":  enriched,
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