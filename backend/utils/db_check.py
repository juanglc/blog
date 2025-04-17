import os
import sys
import django
import pyotp
from pymongo import MongoClient

# Añade el path raíz (blog_project) al sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # -> /home/juanglc/blog_project/backend

# Configura Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings

client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
db = client["blog_db"]
users_collection = db["users"]

# Actualizar documentos en la colección
for user in users_collection.find():
    updated_data = {
        "telefono": user.get("telefono", "+573001112233"),
        "2fa_secret": pyotp.random_base32(),  # Generar un secreto TOTP único
        "is_2fa_enabled": True
    }
    users_collection.update_one({"_id": user["_id"]}, {"$set": updated_data})

print("Estructura de usuarios actualizada.")