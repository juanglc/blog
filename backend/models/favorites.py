from bson import ObjectId

def favorite_schema(data):
    return {
        "_id": str(data.get("_id", ObjectId())),
        "tags": data.get("tags", []),
    }