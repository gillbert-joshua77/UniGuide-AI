from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import os
from django.conf import settings
from .serializers import (
    SkillSerializer, AppSerializer, StudentProfileSerializer,
    SavedOpportunitySerializer, calculate_profile_completion,
)
from .models import Skill, StudentProfile, SavedOpportunity, Application


# ─── Profile (single source of truth) ────────────────────────────────

class StudentProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, user):
        profile, _ = StudentProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        serializer = StudentProfileSerializer(
            self.get_object(request.user),
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'profile_pictures'), exist_ok=True)
        serializer = StudentProfileSerializer(
            self.get_object(request.user),
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentProfileView(APIView):
    """Lightweight profile summary (no fake recommendation data)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = StudentProfile.objects.get_or_create(user=user)
        skills = user.skills.all()
        apps = user.applications.all()
        return Response({
            "full_name": f"{user.first_name} {user.last_name}".strip() or user.email,
            "email": user.email,
            "profile_completion": calculate_profile_completion(profile),
            "skills": SkillSerializer(skills, many=True).data,
            "applications": AppSerializer(apps, many=True).data,
        })


# ─── Skills ──────────────────────────────────────────────────────────

class SkillListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        skills = request.user.skills.all().order_by('name')
        return Response(SkillSerializer(skills, many=True).data, status=status.HTTP_200_OK)


class SkillCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SkillSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data['name']
        # Prevent duplicate skill names for the same user (case-insensitive).
        existing = Skill.objects.filter(user=request.user, name__iexact=name).first()
        if existing:
            existing.percentage = serializer.validated_data.get('percentage', existing.percentage)
            existing.color = serializer.validated_data.get('color', existing.color)
            existing.save()
            return Response(SkillSerializer(existing).data, status=status.HTTP_200_OK)

        skill = Skill.objects.create(
            user=request.user,
            name=name,
            percentage=serializer.validated_data.get('percentage', 0),
            color=serializer.validated_data.get('color'),
        )
        return Response(SkillSerializer(skill).data, status=status.HTTP_201_CREATED)


class SkillDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            skill = Skill.objects.get(pk=pk, user=request.user)
            skill.delete()
            return Response({"message": "Skill removed successfully"}, status=status.HTTP_200_OK)
        except Skill.DoesNotExist:
            return Response({"error": "Skill not found"}, status=status.HTTP_404_NOT_FOUND)


# ─── Saved opportunities ─────────────────────────────────────────────

class SavedOpportunityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved = SavedOpportunity.objects.filter(user=request.user)
        return Response(
            SavedOpportunitySerializer(saved, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        # Avoid storing a duplicate opportunity for the same user.
        opportunity_id = (request.data.get('opportunity_id') or '').strip()
        if not opportunity_id:
            return Response(
                {"error": "opportunity_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        existing = SavedOpportunity.objects.filter(
            user=request.user, opportunity_id=opportunity_id
        ).first()
        if existing:
            return Response(
                SavedOpportunitySerializer(existing).data,
                status=status.HTTP_200_OK,
            )

        serializer = SavedOpportunitySerializer(
            data=request.data, context={'request': request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SavedOpportunityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            saved = SavedOpportunity.objects.get(pk=pk, user=request.user)
            saved.delete()
            return Response({"message": "Removed from saved opportunities"}, status=status.HTTP_200_OK)
        except SavedOpportunity.DoesNotExist:
            return Response({"error": "Saved opportunity not found"}, status=status.HTTP_404_NOT_FOUND)


# ─── Journey (computed, never hardcoded) ────────────────────────────

# Keyword -> recommended skills. Used to derive "skills to develop" from the
# student's REAL interests and goals, not from fabricated data.
SKILL_RECOMMENDATION_MAP = [
    (['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'data science'],
     ['Python', 'SQL', 'Statistics', 'Pandas / NumPy']),
    (['web', 'frontend', 'backend', 'full stack', 'web development', 'web3'],
     ['HTML / CSS', 'JavaScript', 'React', 'Node.js']),
    (['mobile', 'android', 'ios', 'flutter', 'swift'],
     ['Dart', 'Kotlin', 'Swift', 'React Native']),
    (['data', 'analytics', 'business intelligence', 'bi', 'visualization'],
     ['SQL', 'Excel', 'Power BI', 'Python']),
    (['cloud', 'devops', 'aws', 'azure', 'gcp'],
     ['Linux', 'Docker', 'Kubernetes', 'CI/CD']),
    (['security', 'cyber', 'penetration', 'network security'],
     ['Networking', 'Linux', 'Python', 'Cryptography']),
    (['design', 'ui', 'ux', 'product design'],
     ['Figma', 'Design Systems', 'User Research']),
    (['product', 'product management', 'scrum'],
     ['Agile', 'Roadmapping', 'SQL', 'Stakeholder Comm.']),
    (['game', 'unity', 'unreal'],
     ['C#', 'Unity', '3D Math', 'Shader Basics']),
]


def _split_values(text):
    if not text:
        return []
    return [v.strip() for v in str(text).replace('/', ',').split(',') if v.strip()]


def _build_skills_to_develop(profile, existing_skill_names):
    interests = _split_values(profile.interests)
    goals = _split_values(profile.career_goal)
    sources = [(v.lower(), f'your interest in "{v}"') for v in interests]
    sources += [(v.lower(), f'your goal: "{v}"') for v in goals]

    recommendations = []
    seen = set()
    for value, reason in sources:
        for keywords, skills in SKILL_RECOMMENDATION_MAP:
            if any(kw in value for kw in keywords):
                for skill in skills:
                    key = skill.lower()
                    if key in seen or key in existing_skill_names:
                        continue
                    seen.add(key)
                    recommendations.append({"name": skill, "reason": reason})
    return recommendations


def _build_ai_insight(profile, readiness, skills_to_develop):
    if not profile.career_goal and not profile.interests:
        return (
            "Add your interests and career goal to your profile so UniGuide AI "
            "can give you a personalized readiness insight."
        )
    if skills_to_develop:
        first = skills_to_develop[0]['name']
        return (
            f"You are around {readiness}% career-ready. Strengthening "
            f"\"{first}\" would be a high-impact next step based on your profile."
        )
    return (
        f"You are around {readiness}% career-ready. Keep building real projects "
        f"with your current skills to stay on track."
    )


class JourneyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = StudentProfile.objects.get_or_create(user=user)

        skills = user.skills.all()
        existing_skill_names = {s.name.lower() for s in skills}
        apps = user.applications.all()
        saved = SavedOpportunity.objects.filter(user=user)

        completion = calculate_profile_completion(profile)
        skills_to_develop = _build_skills_to_develop(profile, existing_skill_names)

        # Deterministic career readiness from real profile signals.
        readiness = int(round(completion * 0.5))
        readiness += min(skills.count() * 8, 30)
        if profile.career_goal and profile.career_goal.strip():
            readiness += 10
        if apps.exists():
            readiness += 10
        readiness = max(0, min(100, readiness))

        return Response({
            "profile_completion": completion,
            "career_readiness": readiness,
            "current_goals": profile.career_goal or "",
            "interests": _split_values(profile.interests),
            "skills_count": skills.count(),
            "skills": SkillSerializer(skills, many=True).data,
            "skills_to_develop": skills_to_develop,
            "applications": AppSerializer(apps, many=True).data,
            "saved_opportunities_count": saved.count(),
            "ai_insight": _build_ai_insight(profile, readiness, skills_to_develop),
        })
