"""Create (if missing) and migrate the isolated local E2E database.

Guarded by ``e2e_preflight`` so it can never run against the development
database or any production database. The database is only ever created — it
is never dropped.
"""
import MySQLdb
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

EXPECTED_NAME = 'uniguide_ai_e2e'


class Command(BaseCommand):
    help = 'Create (if missing) and migrate the isolated E2E database.'

    # Runs before the test database exists; skip checks that need a connection.
    requires_system_checks = []

    def handle(self, *args, **options):
        call_command('e2e_preflight')

        cfg = settings.DATABASES['default']
        name = str(cfg['NAME'])
        if name != EXPECTED_NAME:
            raise CommandError(
                f'Unexpected database name {name!r}; refusing to create/migrate.'
            )

        try:
            conn = MySQLdb.connect(
                host=cfg['HOST'],
                port=int(cfg['PORT']),
                user=cfg['USER'],
                passwd=cfg['PASSWORD'],
            )
        except Exception as exc:
            raise CommandError(
                'Could not connect to the local MySQL server to create the '
                f'test database: {type(exc).__name__}: {exc}'
            )

        try:
            with conn.cursor() as cur:
                cur.execute(
                    f'CREATE DATABASE IF NOT EXISTS `{name}` '
                    'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
                )
            conn.commit()
        finally:
            conn.close()

        self.stdout.write(
            self.style.SUCCESS(f'[e2e] database `{name}` exists.')
        )

        call_command('migrate', interactive=False, verbosity=1)
