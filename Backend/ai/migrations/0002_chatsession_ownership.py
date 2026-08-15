import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def delete_orphaned_sessions(apps, schema_editor):
    """Remove anonymous chat sessions that cannot be attributed to a user."""
    ChatSession = apps.get_model('ai', 'ChatSession')
    ChatSession.objects.filter(user__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ai', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatsession',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='chat_sessions',
                to=settings.AUTH_USER_MODEL,
                null=True,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='chatsession',
            name='title',
            field=models.CharField(default='New Chat', max_length=120),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='chatsession',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.RunPython(delete_orphaned_sessions, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='chatsession',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='chat_sessions',
                to=settings.AUTH_USER_MODEL,
            ),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name='chatsession',
            options={'ordering': ['-updated_at']},
        ),
    ]
