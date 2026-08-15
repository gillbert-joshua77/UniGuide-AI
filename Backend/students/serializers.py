# students/serializers.py
from rest_framework import serializers
from .models import Skill, Application, StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'full_name', 'email', 'education_level', 'institution',
            'course', 'year_of_study', 'academic_performance',
            'interests', 'career_goal', 'preferred_location',
            'preferred_country', 'budget', 'bio', 'updated_at',
        ]
        read_only_fields = ['updated_at']

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_email(self, obj):
        return obj.user.email

    def validate(self, attrs):
        for field in ('institution', 'course', 'career_goal',
                      'preferred_location', 'preferred_country', 'budget'):
            value = attrs.get(field)
            if isinstance(value, str):
                value = value.strip()
                if len(value) > 300:
                    raise serializers.ValidationError(
                        {field: f'{field} must be at most 300 characters'}
                    )
                attrs[field] = value
        interests = attrs.get('interests')
        if isinstance(interests, str):
            attrs['interests'] = interests.strip()
        bio = attrs.get('bio')
        if isinstance(bio, str):
            attrs['bio'] = bio.strip()
        return attrs


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'percentage', 'color']


class AppSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['role', 'company', 'status', 'color']