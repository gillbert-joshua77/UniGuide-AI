# myapp/pipeline.py
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings


def redirect_with_token(backend, user, response, *args, **kwargs):
    refresh = RefreshToken.for_user(user)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    return {
        'redirect_url': f'{frontend_url}/api/v1/auth/callback?access={str(refresh.access_token)}&refresh={str(refresh)}'
    }