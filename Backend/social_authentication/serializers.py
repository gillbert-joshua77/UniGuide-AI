from rest_framework import serializers
from .utils import Google, register_social_user
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

class GoogleSignInSerializers(serializers.Serializer):
    access_token = serializers.CharField(min_length=6)

    def validate_access_token(self, access_token):
        # Validate token and get user data
        google_user_data = Google.validate(access_token)

        if not google_user_data:
            raise serializers.ValidationError("This token is invalid or has expired")

        # Get user ID safely
        userid = google_user_data.get('sub')
        if not userid:
            raise serializers.ValidationError("Invalid token: missing user ID")

        # Verify audience
        if google_user_data.get('aud') != settings.GOOGLE_CLIENT_ID:
            raise AuthenticationFailed("Could not verify user: client ID mismatch")

        # Get user details safely
        email = google_user_data.get('email')
        first_name = google_user_data.get('given_name', '')
        last_name = google_user_data.get('family_name', '')
        provider = "google"

        # Register or login user
        return register_social_user(provider, email, first_name, last_name)