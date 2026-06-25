# myapp/pipeline.py
from rest_framework_simplejwt.tokens import RefreshToken

def redirect_with_token(backend, user, response, *args, **kwargs):
    refresh = RefreshToken.for_user(user)
    frontend_url = 'http://localhost:5173/api/v1/auth/callback'
    return {
        'redirect_url': f'{frontend_url}?access={str(refresh.access_token)}&refresh={str(refresh)}'
    }