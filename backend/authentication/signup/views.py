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
def sign_up(request):
    try:
        data = request.data
        username = data.get('username')
        password = data.get('password')
        email = data.get('correo')


        # Check if all required fields are provided
        if not username or not password or not email:
            return Response({"error": "Username, password, and email are required"}, status=400)

        # Check if user already exists
        existing_user = db["users"].find_one({"$or": [{"username": username}, {"correo": email}]})
        if existing_user:
            return Response({"error": "User with this username or email already exists"}, status=400)

        # Generate sequential ID
        latest_user = db["users"].find_one(
            {"_id": {"$regex": "^u\\d+$"}},
            sort=[("_id", -1)]
        )
        next_num = int(latest_user["_id"][1:]) + 1 if latest_user else 1
        new_id = f"u{next_num:03d}"

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Create new user
        new_user = {
            "_id": new_id,
            "username": username,
            "password": hashed_password,
            "correo": email,
            "telefono": data.get('telefono'),
            "nombre": data.get('nombre'),
            "role": "lector"  # Default role
        }
        db["users"].insert_one(new_user)

        return Response({"message": "User created successfully", "user_id": new_id}, status=201)

    except Exception as e:
        print(f"Error during sign-up: {e}")
        return Response({"error": "An error occurred during sign-up"}, status=500)