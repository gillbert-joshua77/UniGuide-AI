from django.urls import path
from .views import StudentProfileView, SkillDetailView, StudentProfileDetailView

urlpatterns = [
    path('me/', StudentProfileView.as_view(), name='student-profile'),
    path('skills/<int:pk>/', SkillDetailView.as_view(), name='skill-detail'),
    path('profile/', StudentProfileDetailView.as_view(), name='student-profile-detail'),
]