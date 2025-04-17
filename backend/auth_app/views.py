from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from pymongo import MongoClient
import uuid
from auth_app.services.twofa_service import generate_2fa_secret, get_otp_uri, generate_qr_code_base64
from auth_app.services.auth_service import hash_password, check_password, generate_jwt
from django.conf import settings  # Import settings


client = MongoClient(settings.MONGO_URI)
db = client.blog_db
users = db.users

@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    data = json.loads(request.body)

    if users.find_one({"correo": data["correo"]}):
        return JsonResponse({"error": "Usuario ya registrado"}, status=400)

    user_id = f"u{str(uuid.uuid4())[:8]}"
    secret = generate_2fa_secret()
    otp_uri = get_otp_uri(secret, data["correo"])
    qr_code_base64 = generate_qr_code_base64(otp_uri)

    users.insert_one({
        "_id": user_id,
        "nombre": data["nombre"],
        "correo": data["correo"],
        "telefono": data.get("telefono", ""),
        "contraseña": hash_password(data["contraseña"]),
        "rol": "lector",
        "2fa_secret": secret,
        "is_2fa_enabled": True
    })

    return JsonResponse({
        "message": "Usuario registrado con éxito",
        "2fa_qr": qr_code_base64
    })

@csrf_exempt
def login(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return JsonResponse({"error": "Correo y contraseña requeridos"}, status=400)

        user = users_collection.find_one({"email": email})
        if not user:
            return JsonResponse({"error": "Usuario no encontrado"}, status=404)

        if not verify_password(password, user["password"]):
            return JsonResponse({"error": "Contraseña incorrecta"}, status=401)

        if user.get("two_factor_enabled", False):
            # Devuelve status 2FA requerido (para testear luego)
            return JsonResponse({
                "message": "2FA requerido",
                "2fa_required": True,
                "user_id": str(user["_id"])
            }, status=200)

        # Si no tiene 2FA, retorna JWT
        token = generate_jwt(str(user["_id"]), user["role"])
        return JsonResponse({"token": token}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
