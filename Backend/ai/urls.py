from django.urls import path
from .views import UniGuideChatView, ChatSessionCreateView, ChatSessionDetailView, NewsView

urlpatterns = [
    path('chat/', UniGuideChatView.as_view(), name='uniguide-chat'),
    path('chat/sessions/', ChatSessionCreateView.as_view(), name='chat-session-create'),
    path('chat/sessions/<uuid:session_id>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('news/', NewsView.as_view(), name='it-news'),
]
