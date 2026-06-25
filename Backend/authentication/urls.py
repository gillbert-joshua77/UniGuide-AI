from django.urls import path   # Used to define URL routes
from .views import *           # Import all views from current app (not recommended in large projects but okay here)
from rest_framework_simplejwt.views import TokenRefreshView

# List of URL patterns for this app
urlpatterns = [

  path('register/', RegisterUserView.as_view() , name='register'),  
  # Endpoint to register a new user

  path('verify-email/' , VerifyUserEmail.as_view() , name='verify'),  
  # Endpoint to verify user's email (usually via token link)

  path('login/', LoginUerView.as_view() , name='login'),  
  # Endpoint for user login (returns JWT tokens)

  path('profile/', TestAuthenticationView.as_view() , name='granted'),  
  # Protected route to test authentication (only accessible with valid token)

  path('token/refresh/', TokenRefreshView.as_view() , name='refresh-token'),

  path('logout/', LogOutUserView.as_view(), name='logout'),

  path('password-reset/' , PasswordResetRequestView.as_view() , name='password-reset'),  
  # Endpoint to request password reset email

  path('password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirm.as_view() , name='password-reset-confirm'),  
  # Endpoint to confirm password reset using uid and token from email link

  path('set-new-password/', SetNewPassword.as_view(), name='set-password')  
  # Endpoint to set a new password after verification
]