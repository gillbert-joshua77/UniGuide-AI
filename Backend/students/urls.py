from django.urls import path
from .views import StudentProfileView

urlpatterns = [
    path('me/', StudentProfileView.as_view(), name='student-profile'),
]