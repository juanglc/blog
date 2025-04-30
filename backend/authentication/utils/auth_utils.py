# backend/authentication/utils/auth_utils.py
import jwt
from pymongo import MongoClient
from decouple import config

# Direct database connection
client = MongoClient(config('MONGO_URI'))
db = client["blog_db"]

def verify_token(token):
    try:
        # Use the same JWT_SECRET used for creating tokens
        decoded = jwt.decode(token, config('JWT_SECRET'), algorithms=['HS256'])

        # Get user from database
        user_id = decoded.get('user_id')
        if not user_id:
            print("No user_id in token")
            return None

        # Find the user in the database
        user = db.users.find_one({"_id": user_id})

        if not user:
            print(f"No user found with id: {user_id}")
            return None

        return user
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return None
    except jwt.DecodeError:
        print("Token decode error")
        return None
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None