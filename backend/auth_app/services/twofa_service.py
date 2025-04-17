import pyotp
import qrcode
import base64
from io import BytesIO

def generate_2fa_secret():
    return pyotp.random_base32()

def get_otp_uri(secret, email, issuer="MiBlogApp"):
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)

def generate_qr_code_base64(uri):
    qr = qrcode.make(uri)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()
