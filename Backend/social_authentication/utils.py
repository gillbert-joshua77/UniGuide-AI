from google.auth.transport import requests   # Used to make HTTP requests for Google token verification
from google.oauth2 import id_token   # Used to verify Google OAuth2 tokens
from authentication.models import User   # Import custom User model
from django.contrib.auth import authenticate   # Django authentication function
from django.conf import settings   # Access project settings
from rest_framework.exceptions import AuthenticationFailed   # Exception for authentication failure

# Class to handle Google token validation
class Google():

  @staticmethod
  def validate(access_token):
    try:
      # Verify the token with Google servers (allow 10s clock skew)
      id_info = id_token.verify_oauth2_token(
        access_token,
        requests.Request(),
        clock_skew_in_seconds=10
      )

      # Check issuer to confirm it's from Google
      iss = id_info.get('iss', '')
      if "accounts.google.com" in iss or "account.google.com" in iss:
        return id_info   # Return decoded token info

      print(f"[GOOGLE AUTH ERROR] Issuer invalid: {iss}")
      return None
    except Exception as e:
      print(f"[GOOGLE AUTH ERROR] Validation failed: {e}")
      return None   # Return None if token validation fails



# Function to login a social user
def login_social_user(email, password):

  user = authenticate(email=email, password=password)   # Authenticate user with email & password

  if not user:
    raise AuthenticationFailed("Social authentication failed")

  user_tokens = user.tokens()   # Generate JWT tokens

  # Return user info with tokens
  return {
    'email': user.email,
    'full_name': user.get_full_name,   
    'access_token': str(user_tokens.get('access')),
    'refresh_token': str(user_tokens.get('refresh')),  
  }


# Function to register or login social user
def register_social_user(provider, email, first_name, last_name):

  user = User.objects.filter(email=email)   # Check if user already exists

  if user.exists():
    user_obj = user.first()
    # Allow login if provider matches or if user previously registered via email
    if user_obj.auth_provider == provider or user_obj.auth_provider == 'email':
      if user_obj.auth_provider == 'email':
        user_obj.auth_provider = provider
        user_obj.is_verified = True
        user_obj.save()
      return login_social_user(email, settings.SOCIAL_AUTH_PASSWORD)

    else:
      raise AuthenticationFailed(
        detail=f"Please continue your login with {user_obj.auth_provider}"
      )

  else:
    # If user does not exist, create new user
    new_user = {
      'email': email,
      'first_name': first_name,
      'last_name': last_name,
      'password': settings.SOCIAL_AUTH_PASSWORD,   # Use default password for social login
    }

    register_user = User.objects.create_user(**new_user)   # Create user

    register_user.auth_provider = provider   # Set auth provider (google)
    register_user.is_verified = True   # Mark user as verified
    register_user.save()   # Save user

    # Login newly created user with string email
    return login_social_user(email=register_user.email, password=settings.SOCIAL_AUTH_PASSWORD)