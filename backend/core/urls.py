# In backend/core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from views.articles import get_all_articles, get_article_by_id, create_articles, update_article, get_article_by_tag, get_article_by_author, delete_article
from views.tags import TagViewSet
from views.users import UserViewSet
from django.conf import settings
from django.conf.urls.static import static
from views.images import upload_image
from views.requests import get_all_requests
# Create a router and register your viewsets
router = DefaultRouter()
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Put explicit paths BEFORE the router
    path('api/articles/create/', create_articles, name='create_articles'),
    path("api/articles/", get_all_articles),
    path("api/requests/all/", get_all_requests),
    path("api/articles/<str:article_id>/", get_article_by_id),
    path("api/upload/image/", upload_image, name='upload_image'),
    path("api/articles/<str:article_id>/update/", update_article, name='update_article'),
    path("api/articles/<str:article_id>/delete/", delete_article, name='delete_article'),
    path("api/articles/tag/<str:tag_id>/", get_article_by_tag),
    path("api/articles/author/<str:author_id>/", get_article_by_author),
    path("api/auth/", include("authentication.urls")),
    # Router URLs should come last
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)