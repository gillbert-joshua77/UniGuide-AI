# students/serializers.py
from rest_framework import serializers
from .models import Skill, Application, StudentProfile, SavedOpportunity


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


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'percentage', 'color']

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError('Skill name cannot be empty')
        return name

    def validate(self, attrs):
        # Auto-assign a pleasant color if the client did not provide one.
        if not attrs.get('color'):
            palette = ['#D4AF67', '#4F6BFF', '#2D8A56', '#C17E2A', '#8E5BD6', '#0EA5A4']
            name = attrs.get('name', '')
            attrs['color'] = palette[hash(name.lower()) % len(palette)]
        attrs['color'] = attrs['color'].strip()
        if attrs.get('percentage') is None:
            attrs['percentage'] = 0
        return attrs


class AppSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['role', 'company', 'status', 'color']


class StudentProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    profile_picture = ProfilePictureField(required=False, allow_null=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    # Read-only related data so the frontend has one source of truth.
    # Skills/Applications are owned by the User, not the StudentProfile, so we
    # source them from the reverse relations explicitly.
    skills = SkillSerializer(many=True, read_only=True, source='user.skills')
    applications = AppSerializer(many=True, read_only=True, source='user.applications')
    profile_completion = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'full_name', 'email', 'first_name', 'last_name',
            'profile_picture', 'education_level', 'institution',
            'course', 'year_of_study', 'academic_performance',
            'interests', 'career_goal', 'preferred_location',
            'preferred_country', 'budget', 'bio', 'updated_at',
            'skills', 'applications', 'profile_completion',
        ]
        read_only_fields = ['updated_at']

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_email(self, obj):
        return obj.user.email

    def get_profile_completion(self, obj):
        return calculate_profile_completion(obj)

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


class SavedOpportunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedOpportunity
        fields = [
            'id', 'opportunity_id', 'source', 'title', 'url',
            'organizer', 'location', 'deadline', 'prize', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# ─── Profile completion ──────────────────────────────────────────────
# A single, deterministic definition of "how complete is this profile".
# Used by the serializer, the journey endpoint and the frontend so the
# percentage is never hardcoded.

_PROFILE_FIELDS = [
    'education_level', 'institution', 'course', 'year_of_study',
    'academic_performance', 'interests', 'career_goal',
    'preferred_location', 'preferred_country', 'budget', 'bio',
]


def calculate_profile_completion(profile):
    """Return an integer 0-100 reflecting how complete the profile is.

    Counts the filled StudentProfile text/choice fields, the user's first and
    last name, and whether at least one skill exists.
    """
    if not profile:
        return 0

    user = profile.user
    checks = []

    for field in _PROFILE_FIELDS:
        value = getattr(profile, field, None)
        checks.append(bool(value and str(value).strip()))

    # Name is stored on the User model.
    checks.append(bool(user.first_name and user.first_name.strip()))
    checks.append(bool(user.last_name and user.last_name.strip()))

    # At least one skill is expected for a useful profile.
    checks.append(profile.user.skills.exists())

    filled = sum(1 for c in checks if c)
    total = len(checks)
    if total == 0:
        return 0
    return round((filled / total) * 100)