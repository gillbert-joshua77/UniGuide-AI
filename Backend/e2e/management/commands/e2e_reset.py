"""Flush the isolated E2E database, after a preflight isolation check.

``flush`` truncates data but keeps the schema. The database is never dropped.
"""
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Flush the isolated E2E database (guarded by preflight).'

    requires_system_checks = []

    def handle(self, *args, **options):
        call_command('e2e_preflight')
        call_command('flush', interactive=False, verbosity=1)
        self.stdout.write(
            self.style.SUCCESS('[e2e] isolated test database flushed.')
        )
