from django.db import models   # Django ORM for database models
from django.contrib.auth.models import AbstractBaseUser ,PermissionsMixin  # Base classes for custom user model
from django.utils.translation import gettext_lazy as _   # For translation support
from .manager import UserMangers   # Import custom user manager
from rest_framework_simplejwt.tokens import RefreshToken  # JWT token generator

# Dictionary to define different authentication providers
AUTH_PROVIDERS = {'email': 'email' , 'google' : 'google' , 'github':'github','facebook':'facebook' }

# Custom User model extending Django's base user system
class User(AbstractBaseUser ,PermissionsMixin):

  email = models.EmailField(max_length=225 ,unique= True , verbose_name= ("Email Address"))  # Unique email field
  first_name = models.CharField(max_length=100 , verbose_name=("First Name"))  # User's first name
  last_name = models.CharField(max_length=100 , verbose_name= ("Last Name"))   # User's last name

  is_staff= models.BooleanField(default= False)       # Access to admin panel
  is_superuser = models.BooleanField(default=False)   # Superuser permissions
  is_verified = models.BooleanField(default= False)   # Custom field for email verification
  is_active = models.BooleanField(default=True)       # Active status of user

  date_joined = models.DateTimeField(auto_now_add=True)  # Timestamp when user is created
  last_login = models.DateTimeField(auto_now= True)      # Updates every time user logs in

  # Stores authentication provider (email, google, github, etc.)
  auth_provider =models.CharField(max_length=50 ,default=AUTH_PROVIDERS.get("email"))

  USERNAME_FIELD = "email"   # Use email as username field

  REQUIRED_FIELDS = ["first_name" ,"last_name"]   # Fields required when creating superuser

  objects = UserMangers()   # Attach custom user manager

  def __str__(self):
    return self.email   # String representation of user (email)
 
 
  @property
  def get_full_name(self):
    return f"{self.first_name} {self.last_name}"   # Returns full name of user
  
  # Method to generate JWT tokens for the user
  def tokens (self):
    refresh = RefreshToken.for_user(self)   # Generate refresh token
    return {
      'refresh' : str(refresh),             # Return refresh token as string
      'access' : str(refresh.access_token), # Return access token
    }

# Model to store one-time password (OTP)
class OneTimePassword(models.Model):

  user = models.OneToOneField(User , on_delete=models.CASCADE)  # Each user has one OTP
  code = models.CharField(max_length=6 ,unique= True)           # 6-digit unique OTP code

  def __str__(self):
    return  f"{self.user.first_name}-passcode"   # String representation of OTP object