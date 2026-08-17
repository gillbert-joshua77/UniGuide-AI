from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_student_profile_on_signup(sender, instance, created, **kwargs):
    """Auto-create a StudentProfile whenever a new user signs up.

    Works for both email registration and social (Google) signups so the
    profile is always ready to be filled in after registration.
    """
    if created:
        from .models import StudentProfile

        StudentProfile.objects.get_or_create(user=instance)
