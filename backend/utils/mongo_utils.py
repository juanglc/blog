import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["blog_db"]
users = db["users"]
articles = db["articles"]
favorites = db["favorites"]
tags = db["tags"]
