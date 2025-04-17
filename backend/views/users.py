from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from views.db import db
from serializers.users import UserSerializer

class UserViewSet(ViewSet):
    def list(self, request):
        users = list(db.users.find())
        for user in users:
            user['_id'] = str(user['_id'])
        return Response(users)

    def create(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            db.users.insert_one(serializer.validated_data)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)