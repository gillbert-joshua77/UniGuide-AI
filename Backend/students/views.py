from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import SkillSerializer, AppSerializer

from .models import Skill

class StudentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        full_name = f"{user.first_name} {user.last_name}".strip()
        display_name = full_name if full_name else user.email

        skills = user.skills.all()
        apps = user.applications.all()

        # Dynamic role suggestions based on user skills
        suggestions = []
        skill_names = [s.name.lower() for s in skills]
        
        if any(s in skill_names for s in ['python', 'machine learning', 'ai', 'data science']):
            suggestions.append({"role": "ML Research Intern", "company": "Microsoft", "location": "Hybrid", "match": "92%"})
        if any(s in skill_names for s in ['react', 'javascript', 'typescript', 'frontend', 'html', 'css']):
            suggestions.append({"role": "Software Engineer Intern", "company": "Google", "location": "Remote", "match": "96%"})
        if any(s in skill_names for s in ['sql', 'database', 'postgresql', 'data analytics']):
            suggestions.append({"role": "Data Engineer Intern", "company": "Amazon", "location": "Hybrid", "match": "89%"})
        if any(s in skill_names for s in ['aws', 'docker', 'kubernetes', 'devops']):
            suggestions.append({"role": "Cloud Infrastructure Intern", "company": "Cloudflare", "location": "Remote", "match": "94%"})

        if not suggestions:
            suggestions.append({"role": "Junior Tech Associate", "company": "TechCorp", "location": "Remote", "match": "85%"})

        return Response({
            "full_name": display_name,
            "email": user.email,
            "skills": SkillSerializer(skills, many=True).data,
            "applications": AppSerializer(apps, many=True).data,
            "suggestions": suggestions,
        })

    def post(self, request):
        serializer = SkillSerializer(data=request.data)
        if serializer.is_valid():
            # Avoid duplicate skill names for same user
            name = serializer.validated_data.get('name')
            existing = Skill.objects.filter(user=request.user, name__iexact=name).first()
            if existing:
                existing.percentage = serializer.validated_data.get('percentage', existing.percentage)
                existing.color = serializer.validated_data.get('color', existing.color)
                existing.save()
                return Response(SkillSerializer(existing).data, status=status.HTTP_200_OK)

            skill = serializer.save(user=request.user)
            return Response(SkillSerializer(skill).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SkillDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            skill = Skill.objects.get(pk=pk, user=request.user)
            skill.delete()
            return Response({"message": "Skill removed successfully"}, status=status.HTTP_200_OK)
        except Skill.DoesNotExist:
            return Response({"error": "Skill not found"}, status=status.HTTP_404_NOT_FOUND)

