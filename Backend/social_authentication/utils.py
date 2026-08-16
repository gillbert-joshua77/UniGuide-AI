from google.auth.transport import requests   # Used to make HTTP requests for Google token verification
from google.oauth2 import id_token   # Used to verify Google OAuth2 tokens
from authentication.models import User   # Import custom User model
from django.conf import settings   # Access project settings
from rest_framework.exceptions import AuthenticationFailed   # Exception for authentication failure

# Class to handle Google token validation
class Google():

  @staticmethod
  def validate(access_token):
    try:
      # Verify the token with Google servers (allow 10s clock skew)
      # Passing the audience makes Google enforce that the token was issued to OUR client.
      verify_kwargs = {'clock_skew_in_seconds': 10}
      client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
      if client_id:
        verify_kwargs['audience'] = client_id

      id_info = id_token.verify_oauth2_token(
        access_token,
        requests.Request(),
        **verify_kwargs
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



# Function to build the login response for a verified social user
def login_social_user(user):

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
      # Issue tokens directly; do not re-authenticate with a password the user never set.
      return login_social_user(user_obj)

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

    # Login newly created user
    return login_social_user(register_user)