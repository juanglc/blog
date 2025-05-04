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

@api_view(['GET'])
def get_approved_article_requests_by_user(request, user_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        approved_requests = list(db.article_requests.find({"estado": "aprobado", "autor_id": user_id}).sort('fecha', -1).skip(skip).limit(per_page))
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
        print(f"[ERROR] Error al obtener las solicitudes aprobadas por usuario: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes aprobadas"}, status=500)

@api_view(['GET'])
def get_rejected_article_requests_by_user(request, user_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        rejected_requests = list(db.article_requests.find({"estado": "denegado", "autor_id": user_id}).sort('fecha', -1).skip(skip).limit(per_page))
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
        print(f"[ERROR] Error al obtener las solicitudes rechazadas por usuario: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes rechazadas"}, status=500)

@api_view(['GET'])
def get_active_article_requests_by_user(request, user_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        active_requests = list(db.article_requests.find({"estado": "pendiente", "autor_id": user_id}).sort('fecha', -1).skip(skip).limit(per_page))
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
        print(f"[ERROR] Error al obtener las solicitudes activas por usuario: {e}")
        return JsonResponse({"error": "Error al obtener las solicitudes activas"}, status=500)

@api_view(['PUT'])
def approve_article_request(request, request_id):
    try:
        # Get the pending article ID from the request body
        pending_article_id = request.data.get('pending_article_id')

        if not pending_article_id:
            return JsonResponse({"error": "Missing pending_article_id in request"}, status=400)

        # Update article request status
        db.article_requests.update_one(
            {"_id": request_id},
            {"$set": {"estado": "aprobado"}}
        )

        # Update pending article status using the ID from request body
        db.pending_articles.update_one(
            {"_id": pending_article_id},
            {"$set": {"estado": "aprobado"}}
        )

        return JsonResponse({"message": "Solicitud aprobada exitosamente"}, status=200)

    except Exception as e:
        print(f"[ERROR] Error al aprobar la solicitud: {e}")
        return JsonResponse({"error": "Error al aprobar la solicitud"}, status=500)

@api_view(['PUT'])
def reject_article_request(request, request_id):
    try:
        pending_article_id = request.data.get('pending_article_id')
        db.article_requests.update_one(
            {"_id": request_id},
            {"$set": {"estado": "denegado"}}
        )

        # Update pending article status using the ID from request body
        db.pending_articles.update_one(
            {"_id": pending_article_id},
            {"$set": {"estado": "denegado"}}
        )
        return JsonResponse({"message": "Solicitud rechazada exitosamente"}, status=200)

    except Exception as e:
        print(f"[ERROR] Error al rechazar la solicitud: {e}")
        return JsonResponse({"error": "Error al rechazar la solicitud"}, status=500)

@api_view(['POST'])
def create_article_request(request):
    try:
        data = request.data
        print(f"[DEBUG] Datos recibidos para crear una solicitud de artículo: {data}")

        # Find all request documents to determine the next ID
        all_requests = list(db.article_requests.find(
            {"_id": {"$regex": "^req\\d+$"}},
            {"_id": 1}
        ))

        # Extract numbers from IDs and find the maximum
        max_num = 0
        for req in all_requests:
            try:
                id_parts = req["_id"].split("req")
                if len(id_parts) >= 2:
                    num = int(id_parts[1])
                    if num > max_num:
                        max_num = num
            except (ValueError, IndexError):
                continue

        # Increment the maximum number found
        next_num = max_num + 1

        # Create the ID with req prefix and formatted with leading zeros
        request_id = f"req{next_num:03d}"

        # Inserta la solicitud en la colección
        new_request = {
            "_id": request_id,
            "autor_id": data["autor_id"],
            "tipo": data["tipo"],
            "id_articulo_nuevo": data["id_articulo_nuevo"],
            "estado": "pendiente",  # Estado por defecto
            "fecha": datetime.utcnow()
        }

        # Solo agrega el id del artículo original si se trata de una actualización
        if data["tipo"] == "update" and "id_articulo_original" in data:
            new_request["id_articulo_original"] = data["id_articulo_original"]

        db.article_requests.insert_one(new_request)

        return JsonResponse({
            "message": "Solicitud de artículo creada exitosamente",
            "request_id": request_id
        }, status=201)
    except Exception as e:
        print(f"[ERROR] Error al crear la solicitud de artículo: {e}")
        return JsonResponse({"error": f"Error al crear la solicitud de artículo: {str(e)}"}, status=500)

@api_view(['PUT'])
def set_new_id(request, request_id):
    try:
        new_id = request.data.get('new_id')
        if not new_id:
            return JsonResponse({"error": "Missing new_id in request"}, status=400)

        # Update the article request with the new ID
        db.article_requests.update_one(
            {"_id": request_id},
            {"$set": {"id_articulo_nuevo": new_id}}
        )

        return JsonResponse({"message": "ID actualizado exitosamente"}, status=200)
    except Exception as e:
        print(f"[ERROR] Error al actualizar el ID: {e}")
        return JsonResponse({"error": "Error al actualizar el ID"}, status=500)

@api_view(['PUT'])
def cancel_article_request(request, request_id):
    try:
        # Update the article request status to "cancelado"
        db.article_requests.update_one(
            {"_id": request_id},
            {"$set": {"estado": "cancelado"}}
        )

        return JsonResponse({"message": "Solicitud cancelada exitosamente"}, status=200)
    except Exception as e:
        print(f"[ERROR] Error al cancelar la solicitud: {e}")
        return JsonResponse({"error": "Error al cancelar la solicitud"}, status=500)