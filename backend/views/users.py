# backend/views/users.py
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from pymongo import MongoClient
from django.conf import settings
from authentication.utils.auth_utils import verify_token
from rest_framework.decorators import api_view
from serializers.users import serialize_users_full

# Direct database connection
client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_users(request):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page
        users = list(db.users.find().skip(skip).limit(per_page))
        total_users = len(users)

        if not users:
            return Response({
                "users": [],
                "pagination": {
                    "total": total_users,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_users + per_page - 1) // per_page
                }
            })
        # Add debugging to see exactly what's happening
        enriched = []
        for user in users:
            serialized = serialize_users_full(user)
            print(f"[DEBUG] User: {user}")
            print(f"[DEBUG] Serialized: {serialized}")
            enriched.append(serialized)

        return Response ({
            "users": enriched,
            "pagination": {
                "total": total_users,
                "page": page,
                "per_page": per_page,
                "pages": (total_users + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Error al obtener los usuarios: {e}")
        return Response({"error": "Error al obtener los usuarios"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_user_by_id(request, user_id):
    try:
        print(f"[DEBUG] Obteniendo usuario por ID: {user_id}")
        user = db.users.find_one({"_id": user_id})
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        serialized = serialize_users_full(user)
        print(f"[DEBUG] User: {user}")
        print(f"[DEBUG] Serialized: {serialized}")
        return Response(serialized)

    except Exception as e:
        print(f"[ERROR] Error al obtener el usuario: {e}")
        return Response({"error": "Error al obtener el usuario"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_role(request, pk=None):
    try:
        # Authentication check
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '')

        if not token:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        # Verify token and check if user is admin
        current_user = verify_token(token)
        if not current_user or current_user.get('rol') != 'admin':
            return Response({"error": "Only admin users can update user roles"},
                            status=status.HTTP_403_FORBIDDEN)

        data = request.data

        # Validate data
        if 'rol' not in data:
            return Response({"error": "Role is required"}, status=status.HTTP_400_BAD_REQUEST)

        if data['rol'] not in ['lector', 'escritor', 'admin']:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        # Update user role in database using custom ID format
        result = db.users.update_one(
            {"_id": pk},  # Use the ID directly without ObjectId conversion
            {"$set": {"rol": data['rol']}}
        )

        if result.matched_count == 0:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": "User role updated successfully"}, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error updating user: {str(e)}")
        return Response({"error": f"An error occurred while updating the user: {str(e)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)