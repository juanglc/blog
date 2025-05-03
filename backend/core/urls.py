# In backend/core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from views.articles import get_all_articles, get_article_by_id, create_articles, update_article, get_article_by_tag, get_article_by_author, delete_article
from views.tags import TagViewSet
from django.conf import settings
from django.conf.urls.static import static
from views.images import upload_image
from views.user_requests import get_all_user_requests, get_active_user_requests, get_rejected_user_requests, get_user_request_by_id, get_approved_user_requests, create_user_request, deny_user_request, approve_user_request
from views.article_requests import get_all_article_requests, get_active_article_requests, get_rejected_article_requests, get_article_request_by_id, get_approved_article_requests
from views.drafts import get_all_drafts, get_draft_by_id, update_draft, delete_draft, push_draft
from views.users import get_all_users, update_role, get_user_by_id
from views.article_requests import get_all_article_requests, get_active_article_requests, get_rejected_article_requests, get_article_request_by_id, get_approved_article_requests, approve_article_request, reject_article_request
from views.pending_articles import get_all_pending_articles_by_author, get_pending_article_by_id, create_pending_article, delete_pending_article, pending_to_draft


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
    path("api/requests/users/all/", get_all_user_requests),
    path("api/requests/users/active/", get_active_user_requests),
    path("api/requests/users/<str:request_id>/", get_user_request_by_id),
    path("api/requests/users/rejected/", get_rejected_user_requests),
    path("api/requests/users/approved/", get_approved_user_requests),
    path("api/requests/users/create/<str:user_id>/", create_user_request),
    path("api/requests/users/<str:request_id>/approve/", approve_user_request),
    path("api/requests/users/<str:request_id>/reject/", deny_user_request),
    path("api/pending_articles/all/<str:autor_id>/", get_all_pending_articles_by_author),
    path("api/pending_articles/<str:pending_article_id>/", get_pending_article_by_id),
    path("api/pending_articles/create/", create_pending_article),
    path("api/pending_articles/delete/<str:pa_id>/", delete_pending_article),
    path("api/pending_articles/<str:pa_id>/to_draft/", pending_to_draft),
    path("api/requests/articles/<str:request_id>/approve/", approve_article_request),
    path("api/requests/articles/<str:request_id>/reject/", reject_article_request),
    path("api/requests/articles/approved/", get_approved_article_requests),
    path("api/requests/articles/rejected/", get_rejected_article_requests),
    path("api/requests/articles/active/", get_active_article_requests),
    path("api/requests/articles/<str:request_id>/", get_article_request_by_id),
    path("api/requests/articles/all/", get_all_article_requests),
    path("api/drafts/all/<str:user_id>/", get_all_drafts),
    path("api/drafts/<str:draft_id>/", get_draft_by_id),
    path("api/drafts/update/<str:draft_id>/", update_draft),
    path("api/drafts/push/<str:draft_id>", push_draft),
    path("api/drafts/delete/<str:draft_id>/", delete_draft),
    path("api/users/", get_all_users),
    path("api/users/<str:user_id>/", get_user_by_id),
    path("api/users/update/<str:pk>/", update_role),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)