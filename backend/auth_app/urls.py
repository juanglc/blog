from django.urls import path
from auth_app.views import signup, login

urlpatterns = [
    path('signup/', signup),
    path('login/', login),
]
