from django.db import models
from django.conf import settings

class Skill(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=50)
    percentage = models.IntegerField(default=0)
    color = models.CharField(max_length=20, default="#00b4d8")

    def __str__(self):
        return f"{self.name} ({self.percentage}%)"

class Application(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    role = models.CharField(max_length=100)
    company = models.CharField(max_length=100)
    status = models.CharField(max_length=50) # e.g., "Interview", "Applied"
    color = models.CharField(max_length=20)   # For the frontend badge
    
    def __str__(self):
        return f"{self.role} at {self.company}"