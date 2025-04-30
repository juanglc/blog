# backend/views/users.py
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from pymongo import MongoClient
from django.conf import settings
from authentication.utils.auth_utils import verify_token

# Direct database connection
client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

class UserViewSet(ViewSet):
    def list(self, request):
        users = list(db.users.find())
        for user in users:
            user['_id'] = str(user['_id'])
        return Response(users)

    def create(self, request):
        # Assuming you have a user serializer elsewhere
        user_data = request.data
        result = db.users.insert_one(user_data)
        return Response({"id": str(result.inserted_id)}, status=201)

    def update(self, request, pk=None):
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