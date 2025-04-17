from pymongo import MongoClient
from django.conf import settings

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

users_collection = db["users"]
tags_collection = db["tags"]
articles_collection = db["articles"]