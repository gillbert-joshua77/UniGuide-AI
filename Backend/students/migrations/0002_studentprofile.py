import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('students', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('education_level', models.CharField(blank=True, choices=[('high_school', 'High School'), ('undergraduate', 'Undergraduate'), ('postgraduate', 'Postgraduate / Masters'), ('doctoral', 'Doctoral / PhD'), ('diploma', 'Diploma / Certificate'), ('other', 'Other')], help_text='Current or latest education level', max_length=30)),
                ('institution', models.CharField(blank=True, help_text='Current or latest college/university', max_length=200)),
                ('course', models.CharField(blank=True, help_text='Program / major of study', max_length=200)),
                ('year_of_study', models.CharField(blank=True, choices=[('1', '1st Year'), ('2', '2nd Year'), ('3', '3rd Year'), ('4', '4th Year'), ('5', '5th Year or above'), ('graduated', 'Graduated')], max_length=20)),
                ('academic_performance', models.CharField(blank=True, help_text='e.g. CGPA 8.5/10, 85%, GPA 3.7/4', max_length=100)),
                ('interests', models.TextField(blank=True, help_text='Comma separated topics/fields you are interested in')),
                ('career_goal', models.CharField(blank=True, help_text='Target role or long-term career goal', max_length=300)),
                ('preferred_location', models.CharField(blank=True, help_text='Preferred city / region', max_length=200)),
                ('preferred_country', models.CharField(blank=True, help_text='Preferred country for study/abroad', max_length=200)),
                ('budget', models.CharField(blank=True, help_text='e.g. $15,000/year', max_length=100)),
                ('bio', models.TextField(blank=True, help_text='Any additional preferences or background')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='student_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
