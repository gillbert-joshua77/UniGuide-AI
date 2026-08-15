from django.urls import path
from .views import StudentProfileView, SkillDetailView

urlpatterns = [
    path('me/', StudentProfileView.as_view(), name='student-profile'),
    path('skills/<int:pk>/', SkillDetailView.as_view(), name='skill-detail'),
]