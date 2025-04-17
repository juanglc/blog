from rest_framework import serializers

class UserSerializer(serializers.Serializer):
    _id = serializers.CharField()
    nombre = serializers.CharField()
    correo = serializers.EmailField()
    contraseña = serializers.CharField(write_only=True)
    rol = serializers.ChoiceField(choices=['lector', 'escritor', 'admin'])