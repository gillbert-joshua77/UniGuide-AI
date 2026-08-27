from django.urls import path
from .views import (
    StudentProfileView, SkillDetailView, StudentProfileDetailView,
    SkillListView, SkillCreateView,
    SavedOpportunityListCreateView, SavedOpportunityDetailView,
    JourneyView,
)

urlpatterns = [
    path('me/', StudentProfileView.as_view(), name='student-profile'),
    path('profile/', StudentProfileDetailView.as_view(), name='student-profile-detail'),
    path('skills/', SkillListView.as_view(), name='skill-list'),
    path('skills/add/', SkillCreateView.as_view(), name='skill-create'),
    path('skills/<int:pk>/', SkillDetailView.as_view(), name='skill-detail'),
    path('saved-opportunities/', SavedOpportunityListCreateView.as_view(), name='saved-opportunities'),
    path('saved-opportunities/<int:pk>/', SavedOpportunityDetailView.as_view(), name='saved-opportunity-detail'),
    path('journey/', JourneyView.as_view(), name='student-journey'),
]
