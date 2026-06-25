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
      # Verify the token with Google servers
      id_info = id_token.verify_oauth2_token(access_token, requests.Request())

      # Check issuer to confirm it's from Google
      if "account.google.com" in id_info['iss']:
        return id_info   # Return decoded token info
      
    except Exception as e:
      return 'token is invalid or has expired'   # Return error string if token fails


# Function to login a social user
def login_social_user(email, password):

  user = authenticate(email=email, password=password)   # Authenticate user with email & password

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

    # If provider matches (e.g., user signed up with Google and now logging in with Google)
    if provider == user[0].auth_provider:
      return login_social_user(email, settings.SOCIAL_AUTH_PASSWORD)   # Login existing user

    else:
      # If provider does not match (e.g., Google vs GitHub)
      raise AuthenticationFailed(
        detail=f"Please continue your login with {user[0].auth_provider}"
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

    register_user.auth_provider = provider   # Set auth provider (google/github/etc.)
    register_user.is_verified = True   # Mark user as verified
    register_user.save()   # Save user

    # Login newly created user
    return login_social_user(email=register_user, password=settings.SOCIAL_AUTH_PASSWORD)