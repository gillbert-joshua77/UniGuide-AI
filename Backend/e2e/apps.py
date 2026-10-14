from django.apps import AppConfig


class E2EConfig(AppConfig):
    """Installs the integration-test stubs at server startup.

    Application code is never modified: this only replaces module-level
    symbols that ``ai.views`` already looks up, so that a running integration
    server can never reach Gemini, NewsAPI, or Devpost.
    """

    name = 'e2e'
    label = 'e2e'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'E2E integration-test stubs'

    def ready(self):
        from .stubs import install_stubs

        install_stubs()
