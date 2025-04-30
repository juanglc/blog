# backend/authentication/urls.py
from django.urls import path
from authentication.login.views import login
from authentication.signup.views import sign_up  # Example for signup
# Import other authentication views when you add them

urlpatterns = [
    path('login/', login, name='login'),
    path('signup/', sign_up, name='signup'),
]