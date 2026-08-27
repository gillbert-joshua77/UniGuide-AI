from django.apps import AppConfig


class StudentsConfig(AppConfig):
    name = 'students'

    def ready(self):
        import os
        from django.conf import settings
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'profile_pictures'), exist_ok=True)
        import students.signals  # noqa: F401
