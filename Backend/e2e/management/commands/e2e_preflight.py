"""Abort unless the effective database configuration is the isolated local
E2E database.

Run before ANY migration, flush, or database creation. It reads the resolved
``DATABASES['default']`` (never ``DATABASE_URL`` directly) and fails loudly if
the engine, host, port, or name are not the expected local test values.
Passwords are never printed.
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

EXPECTED_ENGINE = 'django.db.backends.mysql'
EXPECTED_HOST = '127.0.0.1'
EXPECTED_PORT = '3307'
EXPECTED_NAME = 'uniguide_ai_e2e'
PROTECTED_NAMES = {'uniguide_ai', ''}


class Command(BaseCommand):
    help = 'Verify the effective DB points at the isolated local E2E database.'

    # Must not require a DB connection: this runs before the test database
    # exists, and Django's MySQL field checks would otherwise try to connect.
    requires_system_checks = []

    def handle(self, *args, **options):
        cfg = settings.DATABASES.get('default', {})
        engine = str(cfg.get('ENGINE', ''))
        host = str(cfg.get('HOST', ''))
        port = str(cfg.get('PORT', ''))
        name = str(cfg.get('NAME', ''))
        user = str(cfg.get('USER', ''))

        self.stdout.write('[e2e preflight] effective database configuration:')
        self.stdout.write(f'  ENGINE={engine}')
        self.stdout.write(f'  HOST={host}')
        self.stdout.write(f'  PORT={port}')
        self.stdout.write(f'  NAME={name}')
        self.stdout.write(f'  USER={user}')
        self.stdout.write('  PASSWORD=<redacted>')

        problems = []
        if engine != EXPECTED_ENGINE:
            problems.append(f'ENGINE={engine!r} (expected {EXPECTED_ENGINE!r})')
        if host != EXPECTED_HOST:
            problems.append(f'HOST={host!r} (expected {EXPECTED_HOST!r})')
        if port != EXPECTED_PORT:
            problems.append(f'PORT={port!r} (expected {EXPECTED_PORT!r})')
        if name != EXPECTED_NAME:
            problems.append(f'NAME={name!r} (expected {EXPECTED_NAME!r})')
        if name in PROTECTED_NAMES:
            problems.append(f'NAME={name!r} is a protected/blank database name')

        if problems:
            raise CommandError(
                'Refusing to proceed — E2E database isolation check failed: '
                + '; '.join(problems)
            )

        self.stdout.write(
            self.style.SUCCESS(
                '[e2e preflight] OK — isolated test database confirmed.'
            )
        )
