# backend/views/requests.py
import datetime

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
def get_denied_user_requests(request):
    try:
        page=int(request.query_params.get('page', 1))
        per_page=int(request.query_params.get('per_page', 9))
        skip=(page-1)*per_page
        denied_requests = list(db.user_requests.find({'estado': 'denegado'}).sort('fecha', -1).skip(skip).limit(per_page))
        total_denied_requests = db.user_requests.count_documents({'estado': 'denegado'})

        if not denied_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_denied_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_denied_requests + per_page - 1) // per_page
                }
            })

        enriched = []
        for req in denied_requests:
            serialized = serialize_full_user_requests(req, db.users)
            enriched.append(serialized)

        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_denied_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_denied_requests + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes denegadas: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes denegadas"}, status=500)

@api_view(['GET'])
def get_user_request_by_id(request, request_id):
    try:
        user_request = db.user_requests.find_one({"_id": request_id})
        if not user_request:
            return JsonResponse({"error": "Solicitud no encontrada"}, status=404)

        # Add debugging to see exactly what's happening
        serialized = serialize_full_user_requests(user_request, db.users)

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

        enriched = []
        for req in approved_requests:
            serialized = serialize_full_user_requests(req, db.users)
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

@api_view(['POST'])
def create_user_request(request, user_id):
    try:
        data = request.data

        # Find all documents and determine the highest ID number
        all_requests = list(db.user_requests.find(
            {"_id": {"$regex": "^req_user_\\d+$"}},
            {"_id": 1}
        ))

        # Extract numbers from IDs and find the maximum
        max_num = 0
        for req in all_requests:
            try:
                id_parts = req["_id"].split("_")
                if len(id_parts) >= 3:
                    num = int(id_parts[2])
                    if num > max_num:
                        max_num = num
            except (ValueError, IndexError):
                continue

        # Increment the maximum number found
        next_num = max_num + 1

        # Format with leading zeros for consistent numbering
        request_id = f"req_user_{next_num:03d}"

        # Verify this ID doesn't already exist
        existing = db.user_requests.find_one({"_id": request_id})
        if existing:
            # In the rare case of collision, add timestamp to ensure uniqueness
            import time
            timestamp = int(time.time())
            request_id = f"req_user_{next_num:03d}_{timestamp}"

        new_request = {
            "_id": request_id,
            "user_id": user_id,
            "rol_actual": data.get("rol_actual", ""),
            "rol_deseado": data.get("rol_deseado", ""),
            "estado": "pendiente",
            "fecha": datetime.datetime.utcnow()
        }

        db.user_requests.insert_one(new_request)
        return JsonResponse({"message": "Solicitud creada exitosamente"}, status=201)
    except Exception as e:
        print(f"[ERROR] Error al crear la solicitud de usuario: {e}")
        return JsonResponse({"error": "Error al crear la solicitud"}, status=500)

@api_view(['PUT'])
def deny_user_request(request, request_id):
    try:
        db.user_requests.update_one(
            {"_id": request_id},
            {"$set": {"estado": "denegado"}}
        )
        return JsonResponse({"message": "Solicitud denegada exitosamente"}, status=200)
    except Exception as e:
        print(f"[ERROR] Error al denegar la solicitud: {e}")
        return JsonResponse({"error": "Error al denegar la solicitud"}, status=500)

@api_view(['PUT'])
def approve_user_request(request, request_id):
    try:
        db.user_requests.update_one(
            {"_id": request_id},
            {"$set": {"estado": "aprobado"}}
        )
        data = request.data
        user_id = data.get("autor_id")
        new_role = data.get("rol_deseado")
        db.users.update_one(
            {"_id": user_id},
            {"$set": {"rol": new_role}}
        )
        return JsonResponse({"message": "Solicitud aprobada exitosamente"}, status=200)
    except Exception as e:
        print(f"[ERROR] Error al aprobar la solicitud: {e}")
        return JsonResponse({"error": "Error al aprobar la solicitud"}, status=500)

@api_view(['GET'])
def check_active_requests(request, user_id):
    try:
        checker = list(db.user_requests.find({'user_id': user_id, 'estado': 'pendiente'}))
        if len(checker) > 0:
            request_id = checker[0]["_id"]  # Access the first element's _id
            return JsonResponse({
                "message": "Ya existe una solicitud activa para este usuario",
                "request_id": request_id
            }, status=400)
        return JsonResponse({"message": "No hay solicitudes activas para este usuario"}, status=200)
    except Exception as e:
        print(f"[ERROR] Error al verificar la solicitud activa: {e}")
        return JsonResponse({"error": "Error al verificar la solicitud activa"}, status=500)
@api_view(['GET'])
def get_active_user_requests_by_user(request, user_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        user_requests = list(db.user_requests.find({"user_id": user_id, "estado": "pendiente"}).sort('fecha', -1).skip(skip).limit(per_page))
        total_user_requests = len(user_requests)
        if not user_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_user_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_user_requests + per_page - 1) // per_page
                },
                "message": "No hay solicitudes para este usuario"
            })

        enriched = []
        for req in user_requests:
            serialized = serialize_full_user_requests(req, db.users)
            enriched.append(serialized)

        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_user_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_user_requests + per_page - 1) // per_page
            },
            "message": "Solicitudes obtenidas exitosamente"
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes por usuario: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes"}, status=500)

@api_view(['GET'])
def get_denied_user_requests_by_user(request, user_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        user_requests = list(db.user_requests.find({"user_id": user_id, "estado": "denegado"}).sort('fecha', -1).skip(skip).limit(per_page))
        total_user_requests = len(user_requests)
        if not user_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_user_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_user_requests + per_page - 1) // per_page
                },
                "message": "No hay solicitudes para este usuario"
            })

        enriched = []
        for req in user_requests:
            serialized = serialize_full_user_requests(req, db.users)
            enriched.append(serialized)

        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_user_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_user_requests + per_page - 1) // per_page
            },
            "message": "Solicitudes obtenidas exitosamente"
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes por usuario: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes"}, status=500)

@api_view(['GET'])
def get_approved_user_requests_by_user(request, user_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        user_requests = list(db.user_requests.find({"user_id": user_id, "estado": "aprobado"}).sort('fecha', -1).skip(skip).limit(per_page))
        total_user_requests = len(user_requests)
        if not user_requests:
            return Response({
                "requests": [],
                "pagination": {
                    "total": total_user_requests,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_user_requests + per_page - 1) // per_page
                },
                "message": "No hay solicitudes para este usuario"
            })

        enriched = []
        for req in user_requests:
            serialized = serialize_full_user_requests(req, db.users)
            enriched.append(serialized)

        return Response({
            "requests": enriched,
            "pagination": {
                "total": total_user_requests,
                "page": page,
                "per_page": per_page,
                "pages": (total_user_requests + per_page - 1) // per_page
            },
            "message": "Solicitudes obtenidas exitosamente"
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener las solicitudes por usuario: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes"}, status=500)

@api_view(['PUT'])
def cancel_user_request(request, request_id):
    try:
        result = db.user_requests.update_one(
            {"_id": request_id},  # Use the ID directly without ObjectId conversion
            {"$set": {"estado": "cancelado"}}
        )

        if result.matched_count == 0:
            return Response({"error": "User request not found"}, status=400)

        return Response({"message": "User request cancelled successfully"}, status=200)

    except Exception as e:
        print(f"Error cancelling user request: {str(e)}")
        return Response({"error": f"An error occurred while cancelling the user request: {str(e)}"},
                        status=500)