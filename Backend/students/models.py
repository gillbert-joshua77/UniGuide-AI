from django.db import models
from django.conf import settings


class StudentProfile(models.Model):
    EDUCATION_LEVEL_CHOICES = [
        ('high_school', 'High School'),
        ('undergraduate', 'Undergraduate'),
        ('postgraduate', 'Postgraduate / Masters'),
        ('doctoral', 'Doctoral / PhD'),
        ('diploma', 'Diploma / Certificate'),
        ('other', 'Other'),
    ]

    YEAR_OF_STUDY_CHOICES = [
        ('1', '1st Year'),
        ('2', '2nd Year'),
        ('3', '3rd Year'),
        ('4', '4th Year'),
        ('5', '5th Year or above'),
        ('graduated', 'Graduated'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile',
    )
    education_level = models.CharField(
        max_length=30, choices=EDUCATION_LEVEL_CHOICES, blank=True,
        help_text='Current or latest education level'
    )
    institution = models.CharField(
        max_length=200, blank=True,
        help_text='Current or latest college/university'
    )
    course = models.CharField(
        max_length=200, blank=True,
        help_text='Program / major of study'
    )
    year_of_study = models.CharField(
        max_length=20, choices=YEAR_OF_STUDY_CHOICES, blank=True
    )
    academic_performance = models.CharField(
        max_length=100, blank=True,
        help_text='e.g. CGPA 8.5/10, 85%, GPA 3.7/4'
    )
    interests = models.TextField(
        blank=True,
        help_text='Comma separated topics/fields you are interested in'
    )
    career_goal = models.CharField(
        max_length=300, blank=True,
        help_text='Target role or long-term career goal'
    )
    preferred_location = models.CharField(
        max_length=200, blank=True,
        help_text='Preferred city / region'
    )
    preferred_country = models.CharField(
        max_length=200, blank=True,
        help_text='Preferred country for study/abroad'
    )
    budget = models.CharField(
        max_length=100, blank=True,
        help_text='e.g. $15,000/year'
    )
    bio = models.TextField(
        blank=True,
        help_text='Any additional preferences or background'
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} profile"


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