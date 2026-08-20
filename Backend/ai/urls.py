from django.urls import path
from .views import (
    UniGuideChatView, ChatSessionCreateView, ChatSessionDetailView,
    NewsView, GuidedQuestionView, GuidedGeographicDataView,
    HackathonView,
)

urlpatterns = [
    path('chat/', UniGuideChatView.as_view(), name='uniguide-chat'),
    path('chat/sessions/', ChatSessionCreateView.as_view(), name='chat-session-create'),
    path('chat/sessions/<uuid:session_id>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('chat/guided-question/', GuidedQuestionView.as_view(), name='guided-question'),
    path('chat/geographic-data/', GuidedGeographicDataView.as_view(), name='guided-geographic-data'),
    path('news/', NewsView.as_view(), name='it-news'),
    path('hackathons/', HackathonView.as_view(), name='hackathons'),
]
