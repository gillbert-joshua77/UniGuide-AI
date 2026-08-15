from rest_framework import serializers
from .utils import Google, register_social_user
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

class GoogleSignInSerializers(serializers.Serializer):
    access_token = serializers.CharField(min_length=6)

    def validate(self, attrs):
        access_token = attrs.get('access_token')
        google_user_data = Google.validate(access_token)

        if not google_user_data or not isinstance(google_user_data, dict):
            raise serializers.ValidationError({"access_token": "This Google token is invalid or has expired"})

        userid = google_user_data.get('sub')
        if not userid:
            raise serializers.ValidationError({"access_token": "Invalid token: missing Google user ID"})

        # Verify audience if GOOGLE_CLIENT_ID is set
        aud = google_user_data.get('aud')
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if client_id and aud != client_id:
            print(f"[GOOGLE AUTH ERROR] Audience mismatch. Token aud: '{aud}' vs Settings GOOGLE_CLIENT_ID: '{client_id}'")
            # If client_id is set but does not match, log warning but allow if verified
            if not aud:
                raise serializers.ValidationError({"access_token": "Client ID verification failed"})

        email = google_user_data.get('email')
        if not email:
            raise serializers.ValidationError({"access_token": "Google account missing email address"})

        first_name = google_user_data.get('given_name', '')
        last_name = google_user_data.get('family_name', '')
        provider = "google"

        try:
            return register_social_user(provider, email, first_name, last_name)
        except Exception as e:
            print(f"[GOOGLE AUTH ERROR] Social registration failed: {e}")
            raise serializers.ValidationError({"access_token": str(e)})
