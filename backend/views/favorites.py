from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from views.db import db
from serializers.favorites import FavoriteSerializer

class FavoriteViewSet(ViewSet):
    def list(self, request):
        favorites = list(db.favorites.find())
        for fav in favorites:
            fav['_id'] = str(fav['_id'])
        return Response(favorites)

    def create(self, request):
        serializer = FavoriteSerializer(data=request.data)
        if serializer.is_valid():
            db.favorites.replace_one({"_id": serializer.validated_data['_id']}, serializer.validated_data, upsert=True)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)