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

        # Count total articles for pagination metadata
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
    """Create a new article"""
    print("DEBUG: create_articles function called with POST method")

    try:
        data = request.data
        print(f"[DEBUG] Received article data: {data}")

        required_fields = ['titulo', 'contenido_markdown', 'descripcion']
        for field in required_fields:
            if not data.get(field):
                return Response({"error": f"Missing required field: {field}"}, status=400)

        latest_article = db.articles.find_one(
            {"_id": {"$regex": "^a\\d+$"}},
            sort=[("_id", -1)]
        )

        if latest_article:
            latest_id = latest_article["_id"]
            next_num = int(latest_id[1:]) + 1
        else:
            next_num = 1

        new_id = f"a{next_num:03d}"

        article = {
            "_id": new_id,
            "titulo": data.get("titulo"),
            "contenido_markdown": data.get("contenido_markdown"),
            "imagen_url": data.get("imagen_url", ""),
            "tags": data.get("tags", []),
            "autor_id": data.get("autor_id"),
            "fecha_creacion": data.get("fecha_creacion", datetime.now().isoformat()),
            "descripcion": datetime.utcnow()
        }

        db.articles.insert_one(article)

        return Response({
            "message": "Article created successfully",
            "id": article["_id"]
        }, status=201)

    except Exception as e:
        print(f"[ERROR] Exception in create_articles: {e}")
        return Response({"error": str(e)}, status=500)

# In views/articles.py
@api_view(['PUT'])
def update_article(request, article_id):
    try:
        print(f"[DEBUG] Updating article {article_id}")
        article = db.articles.find_one({"_id": article_id})
        if not article:
            return Response({"error": "Article not found"}, status=404)

        data = request.data
        print(f"[DEBUG] Received update data: {data}")

        updates = {}

        # Only update fields that have changed
        if 'titulo' in data and data['titulo'] != article.get('titulo'):
            updates['titulo'] = data['titulo']
            print(f"[DEBUG] Updating titulo: {data['titulo']}")

        if 'contenido_markdown' in data and data['contenido_markdown'] != article.get('contenido_markdown'):
            updates['contenido_markdown'] = data['contenido_markdown']
            print(f"[DEBUG] Updating contenido_markdown")

        if 'imagen_url' in data and data['imagen_url'] != article.get('imagen_url'):
            updates['imagen_url'] = data['imagen_url']
            print(f"[DEBUG] Updating imagen_url: {data['imagen_url']}")
        print(f"[DEBUG] Tags originales: {data['tags']} - tipo: {type(data['tags'])}")
        # Don't compare with existing tags, just update them
        updates['tags'] = data['tags']
        print(f"[DEBUG] Updating tags directly: {data['tags']}")

        if 'descripcion' in data and data['descripcion'] != article.get('descripcion'):
            updates['descripcion'] = data['descripcion']
            print(f"[DEBUG] Updating descripcion: {data['descripcion']}")

        # Always update fecha_actualizacion field
        current_time = datetime.now().isoformat()
        updates['fecha_actualizacion'] = current_time
        print(f"[DEBUG] Setting fecha_actualizacion: {current_time}")

        # Only perform update if there are changes
        if updates:
            print(f"[DEBUG] Performing update with fields: {list(updates.keys())}")
            result = db.articles.update_one(
                {"_id": article_id},
                {"$set": updates}
            )
            print(f"[DEBUG] Update result: {result.modified_count} document(s) modified")

            # Verify the update
            updated_article = db.articles.find_one({"_id": article_id})
            print(f"[DEBUG] Updated article fecha_actualizacion: {updated_article.get('fecha_actualizacion', 'Not found')}")

            return Response({
                "message": "Article updated successfully",
                "updated_fields": list(updates.keys()),
                "fecha_actualizacion": updates['fecha_actualizacion']
            })
        else:
            print("[DEBUG] No changes detected")
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