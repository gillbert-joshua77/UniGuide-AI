from django.urls import path
from .views import UniGuideChatView, NewsView

urlpatterns = [
    path('chat/', UniGuideChatView.as_view(), name='uniguide-chat'),
    path('news/', NewsView.as_view(), name='it-news'),
]