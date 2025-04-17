from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from views.db import db
from serializers.tags import TagSerializer

class TagViewSet(ViewSet):
    def list(self, request):
        tags = list(db.tags.find())
        for tag in tags:
            tag['_id'] = str(tag['_id'])
        return Response(tags)

    def create(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            db.tags.insert_one(serializer.validated_data)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def retrieve(self, request, pk=None):
        tag = db.tags.find_one({"_id": pk})
        if not tag:
            return Response(status=404)
        tag['_id'] = str(tag['_id'])
        return Response(tag)

    def update(self, request, pk=None):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            db.tags.update_one(
                {"_id": pk},
                {"$set": serializer.validated_data}
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def destroy(self, request, pk=None):
        result = db.tags.delete_one({"_id": pk})
        if result.deleted_count:
            return Response(status=204)
        return Response(status=404)