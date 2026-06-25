from django.urls import path
from .views import UniGuideChatView

urlpatterns = [
    path('chat/', UniGuideChatView.as_view(), name='uniguide-chat'),
]