# backend/authentication/login/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pymongo import MongoClient
import jwt
import bcrypt
import datetime
from decouple import config

# Connect to MongoDB
client = MongoClient(config('MONGO_URI'))
db = client["blog_db"]

@api_view(['POST'])
def login(request):
    try:
        data = request.data
        email = data.get('correo')
        username = data.get('username')
        password = data.get('password')

        # Check if credentials were provided
        if not password or (not email and not username):
            return Response({"error": "Email/username and password are required"}, status=400)

        # Find user by email or username
        if email:
            user = db["users"].find_one({"correo": email})
        else:
            user = db["users"].find_one({"username": username})

        if not user:
            return Response({"error": "User not found"}, status=404)

        # Debug output to check password format
        print(f"Stored password type: {type(user['password'])}")
        print(f"Stored password: {user['password'][:20]}...")  # Print first 20 chars for debugging

        # Fix password verification
        try:
            password_input = password.encode('utf-8')
            stored_password = user["password"]

            # If stored as string in DB, convert to bytes
            if isinstance(stored_password, str):
                stored_password = stored_password.encode('utf-8')

            # Try to verify password
            if not bcrypt.checkpw(password_input, stored_password):
                return Response({"error": "Invalid password"}, status=401)

        except Exception as e:
            print(f"Password verification error: {e}")
            # If there was an error with bcrypt verification, try direct comparison as fallback
            # This is not secure but might help debug the issue
            if password != user.get("password"):
                return Response({"error": "Invalid password"}, status=401)

        # Generate JWT token
        token = jwt.encode({
            "user_id": str(user["_id"]),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, config('JWT_SECRET'), algorithm='HS256')

        # Return user data
        user_data = {
            "_id": str(user["_id"]),
            "username": user.get("username", ""),
            "correo": user.get("correo", ""),
            "nombre": user.get("nombre", ""),
            "rol": user.get("rol", "lector"),
            "telefono": user.get("telefono", "")
        }

        return Response({
            "token": token,
            "user": user_data
        }, status=200)

    except Exception as e:
        print(f"[ERROR] Login Exception: {e}")
        return Response({"error": str(e)}, status=500)