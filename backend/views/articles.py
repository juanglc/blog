from pymongo import MongoClient
from django.conf import settings
from django.http import JsonResponse
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from serializers.articles import serialize_article_full

client = MongoClient(settings.MONGO_URI)
db = client["blog_db"]

@api_view(['GET'])
def get_all_articles(request):
    try:
        # Get page number from query params, default to 1
        page = int(request.query_params.get('page', 1))
        # Get items per page from query params, default to 9
        per_page = int(request.query_params.get('per_page', 9))

        # Calculate skip value
        skip = (page - 1) * per_page

        # Get the total count of articles for pagination FIRST
        total_articles = db.articles.count_documents({})

        # Get articles sorted by date (newest first) with pagination
        articles = list(db.articles.find().sort('fecha_creacion', -1).skip(skip).limit(per_page))

        if not articles:
            return JsonResponse({
                "articles": [],
                "pagination": {
                    "total": total_articles,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_articles + per_page - 1) // per_page
                }
            }, safe=False)

        # Fix the import at the top of file to resolve the serialize_article_full reference
        enriched = [serialize_article_full(article, db.users, db.tags) for article in articles]

        return Response({
            "articles": enriched,
            "pagination": {
                "total": total_articles,
                "page": page,
                "per_page": per_page,
                "pages": (total_articles + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Exception in get_all_articles: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_all_articles_by_author(request, author_id):
    try:
        # Get page number from query params, default to 1
        page = int(request.query_params.get('page', 1))
        # Get items per page from query params, default to 9
        per_page = int(request.query_params.get('per_page', 9))

        # Calculate skip value
        skip = (page - 1) * per_page

        # Get articles sorted by date (newest first) with pagination
        articles = list(db.articles.find({'autor_id': author_id}).sort('fecha_creacion', -1).skip(skip).limit(per_page))

        # Count total articles for pagination metadata
        total_articles = len(articles)

        if not articles:
            return JsonResponse({
                "articles": [],
                "pagination": {
                    "total": total_articles,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_articles + per_page - 1) // per_page
                }
            }, safe=False)

        enriched = [serialize_article_full(article, db.users, db.tags) for article in articles]

        return Response({
            "articles": enriched,
            "pagination": {
                "total": total_articles,
                "page": page,
                "per_page": per_page,
                "pages": (total_articles + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Exception in get_all_articles: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_article_by_tag(request, tag_id):
    try:
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 9))
        skip = (page - 1) * per_page

        # Find articles with the given tag
        articles = list(db.articles.find({"tags": tag_id}).sort('fecha_creacion', -1).skip(skip).limit(per_page))
        total_articles = db.articles.count_documents({"tags": tag_id})

        if not articles:
            return Response({
                "articles": [],
                "pagination": {
                    "total": total_articles,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_articles + per_page - 1) // per_page
                }
            })

        # Enrich articles with author and tag information
        enriched_articles = [serialize_article_full(article, db.users, db.tags) for article in articles]

        return Response({
            "articles": enriched_articles,
            "pagination": {
                "total": total_articles,
                "page": page,
                "per_page": per_page,
                "pages": (total_articles + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Exception in get_article_by_tag: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_article_by_author(request, author_id):
    try:
        # Get page number from query params, default to 1
        page = int(request.query_params.get('page', 1))
        # Get items per page from query params, default to 9
        per_page = int(request.query_params.get('per_page', 9))

        # Calculate skip value
        skip = (page - 1) * per_page

        # Count total matching articles
        total_articles = db.articles.count_documents({"autor_id": author_id})

        # Find articles sorted by date
        articles = list(db.articles.find({"autor_id": author_id})
                        .sort('fecha_creacion', -1)
                        .skip(skip)
                        .limit(per_page))

        if not articles:
            return JsonResponse({
                "articles": [],
                "pagination": {
                    "total": total_articles,
                    "page": page,
                    "per_page": per_page,
                    "pages": (total_articles + per_page - 1) // per_page
                }
            }, safe=False)

        enriched = [serialize_article_full(article, db.users, db.tags) for article in articles]

        return Response({
            "articles": enriched,
            "pagination": {
                "total": total_articles,
                "page": page,
                "per_page": per_page,
                "pages": (total_articles + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] Exception in get_article_by_author: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_article_by_id(request, article_id):
    try:
        article = db.articles.find_one({"_id": article_id})
        if not article:
            return Response({"error": "Artículo no encontrado"}, status=404)

        enriched_article = serialize_article_full(article, db.users, db.tags)
        return Response(enriched_article)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def create_articles(request):
    try:
        data = request.data
        required_fields = ['titulo', 'contenido_markdown', 'descripcion']
        for field in required_fields:
            if not data.get(field):
                return Response({"error": f"Missing required field: {field}"}, status=400)

        latest_article = db.articles.find_one(
            {"_id": {"$regex": "^a\\d+$"}},
            sort=[("_id", -1)]
        )

        next_num = int(latest_article["_id"][1:]) + 1 if latest_article else 1
        new_id = f"a{next_num:03d}"

        # Extract only the `_id` from the tags array
        tags = data.get("tags", [])
        if not all(isinstance(tag, dict) and "_id" in tag for tag in tags):
            return Response({"error": "Tags must be an array of objects with an '_id' field"}, status=400)
        tag_ids = [tag["_id"] for tag in tags]

        article = {
            "_id": new_id,
            "titulo": data.get("titulo"),
            "contenido_markdown": data.get("contenido_markdown"),
            "imagen_url": data.get("imagen_url", ""),
            "tags": tag_ids,  # Store only tag IDs
            "autor_id": data.get("autor_id"),
            "fecha_creacion": datetime.now().isoformat(),
            "descripcion": data.get("descripcion", ""),
        }

        db.articles.insert_one(article)

        return Response({
            "message": "Article created successfully",
            "id": article["_id"]
        }, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

# In views/articles.py
@api_view(['PUT'])
def update_article(request, article_id):
    try:
        article = db.articles.find_one({"_id": article_id})
        if not article:
            return Response({"error": "Article not found"}, status=404)

        data = request.data

        updates = {}

        # Only update fields that have changed
        if 'titulo' in data and data['titulo'] != article.get('titulo'):
            updates['titulo'] = data['titulo']

        if 'contenido_markdown' in data and data['contenido_markdown'] != article.get('contenido_markdown'):
            updates['contenido_markdown'] = data['contenido_markdown']

        if 'imagen_url' in data and data['imagen_url'] != article.get('imagen_url'):
            updates['imagen_url'] = data['imagen_url']

        if 'tags' in data:
            tags = data.get("tags", [])
            if not all(isinstance(tag, dict) and "_id" in tag for tag in tags):
                return Response({"error": "Tags must be an array of objects with an '_id' field"}, status=400)
            tag_ids = [tag["_id"] for tag in tags]
            updates['tags'] = tag_ids

        if 'descripcion' in data and data['descripcion'] != article.get('descripcion'):
            updates['descripcion'] = data['descripcion']

        # Always update fecha_actualizacion field
        current_time = datetime.now().isoformat()
        updates['fecha_actualizacion'] = current_time

        # Only perform update if there are changes
        if updates:
            result = db.articles.update_one(
                {"_id": article_id},
                {"$set": updates}
            )

            # Verify the update
            updated_article = db.articles.find_one({"_id": article_id})

            return Response({
                "message": "Article updated successfully",
                "updated_fields": list(updates.keys()),
                "fecha_actualizacion": updates['fecha_actualizacion']
            })
        else:
            return Response({"message": "No changes to update"})

    except Exception as e:
        print(f"[ERROR] Exception in update_article: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['DELETE'])
def delete_article(request, article_id):
    try:
        article = db.articles.find_one({"_id": article_id})
        if not article:
            return Response({"error": "Artículo no encontrado"}, status=404)

        # Delete the article from the database
        result = db.articles.delete_one({"_id": article_id})

        if result.deleted_count > 0:
            return Response({
                "message": "Artículo eliminado correctamente",
                "id": article_id
            })
        else:
            return Response({"error": "No se pudo eliminar el artículo"}, status=500)

    except Exception as e:
        print(f"[ERROR] Exception in delete_article: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_author_by_article(request, article_id):
    try:
        article = db.articles.find_one({"_id": article_id}, {"autor_id": 1, "_id": 0})
        if not article or "autor_id" not in article:
            return Response({"error": "Author not found"}, status=404)
        return Response({"autor_id": article["autor_id"]})
    except Exception as e:
        return Response({"error": str(e)}, status=500)