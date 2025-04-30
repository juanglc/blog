# In backend/core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from views.articles import get_all_articles, get_article_by_id, create_articles, update_article, get_article_by_tag, get_article_by_author, delete_article
from views.tags import TagViewSet
from django.conf import settings
from django.conf.urls.static import static
from views.images import upload_image
from views.user_requests import get_all_user_requests, get_active_user_requests, get_rejected_user_requests, get_user_request_by_id, get_approved_user_requests
from views.article_requests import get_all_article_requests, get_active_article_requests, get_rejected_article_requests, get_article_request_by_id, get_approved_article_requests
from views.drawers import get_all_drawers, get_drawer_by_id
from views.users import get_all_users, update_role, get_user_by_id
# Create a router and register your viewsets
router = DefaultRouter()
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    # Put explicit paths BEFORE the router
    path('api/articles/create/', create_articles, name='create_articles'),
    path("api/articles/", get_all_articles),
    path("api/articles/<str:article_id>/", get_article_by_id),
    path("api/upload/image/", upload_image, name='upload_image'),
    path("api/articles/<str:article_id>/update/", update_article, name='update_article'),
    path("api/articles/<str:article_id>/delete/", delete_article, name='delete_article'),
    path("api/articles/tag/<str:tag_id>/", get_article_by_tag),
    path("api/articles/author/<str:author_id>/", get_article_by_author),
    path("api/auth/", include("authentication.urls")),
    path("api/requests/articles/", get_all_article_requests),
    path("api/requests/articles/active/", get_active_article_requests),
    path("api/requests/articles/rejected/", get_rejected_article_requests),
    path("api/requests/articles/approved/", get_approved_article_requests),
    path("api/requests/articles/<str:request_id>/", get_article_request_by_id),
    path("api/requests/users/", get_all_user_requests),
    path("api/requests/users/active/", get_active_user_requests),
    path("api/requests/users/rejected/", get_rejected_user_requests),
    path("api/requests/users/approved/", get_approved_user_requests),
    path("api/requests/users/<str:request_id>/", get_user_request_by_id),
    path("api/drawers/", get_all_drawers),
    path("api/drawers/<str:drawer_id>/", get_drawer_by_id),
    path("api/users/", get_all_users),
    path("api/users/<str:user_id>/", get_user_by_id),
    path("api/users/update/<str:pk>/", update_role),
    # Router URLs should come last
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)