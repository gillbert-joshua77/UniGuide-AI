# students/serializers.py
from rest_framework import serializers
from .models import Skill, Application, StudentProfile


class ProfilePictureField(serializers.ImageField):
    """Writable image field that:
    - accepts a real file upload (multipart PUT),
    - ignores plain-string echoes of the current URL (JSON PUT of the form),
    - returns an absolute URL in the response.
    """

    def to_internal_value(self, data):
        if data is None or isinstance(data, str):
            raise serializers.SkipField()
        return super().to_internal_value(data)

    def to_representation(self, value):
        if not value:
            return None
        request = self.context.get('request')
        url = value.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class StudentProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    profile_picture = ProfilePictureField(required=False, allow_null=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = StudentProfile
        fields = [
            'full_name', 'email', 'first_name', 'last_name',
            'profile_picture', 'education_level', 'institution',
            'course', 'year_of_study', 'academic_performance',
            'interests', 'career_goal', 'preferred_location',
            'preferred_country', 'budget', 'bio', 'updated_at',
        ]
        read_only_fields = ['updated_at']

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_email(self, obj):
        return obj.user.email

    def update(self, instance, validated_data):
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)

        if first_name is not None or last_name is not None:
            user = instance.user
            if first_name is not None and first_name.strip():
                user.first_name = first_name.strip()
            if last_name is not None and last_name.strip():
                user.last_name = last_name.strip()
            user.save(update_fields=['first_name', 'last_name'])

        return super().update(instance, validated_data)

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