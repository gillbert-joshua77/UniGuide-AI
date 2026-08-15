from django.contrib import admin
from .models import StudentProfile, Skill, Application


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'education_level', 'course', 'preferred_country', 'updated_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'institution', 'course')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'percentage', 'color', 'user')
    search_fields = ('name', 'user__email')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('role', 'company', 'status', 'user')
    search_fields = ('role', 'company', 'user__email')
