from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import SkillSerializer, AppSerializer

class StudentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # ✅ Combine first_name and last_name to create the full_name for React
        # .strip() handles cases where one of them might be empty
        full_name = f"{user.first_name} {user.last_name}".strip()
        
        # Fallback: If both names are empty, show the email or "Student"
        display_name = full_name if full_name else user.email

        # Fetch skills and apps from DB
        skills = user.skills.all()
        apps = user.applications.all()

        # ✅ Ensure 'return' is present
        return Response({
            "full_name": display_name,
            "email": user.email,
            "skills": SkillSerializer(skills, many=True).data,
            "applications": AppSerializer(apps, many=True).data
        })

    def post(self, request):
        serializer = SkillSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        user = request.user
        skills = user.skills.all()
        apps = user.applications.all()

        # Simple logic: If they have Python, suggest ML. If they have React, suggest Frontend.
        suggestions = []
        skill_names = [s.name.lower() for s in skills]
        
        if 'python' in skill_names:
            suggestions.append({"role": "ML Research Intern", "company": "Microsoft", "location": "Hybrid", "match": "88%"})
        if 'react' in skill_names or 'javascript' in skill_names:
            suggestions.append({"role": "Software Engineer Intern", "company": "Google", "location": "Remote", "match": "95%"})

        return Response({
            "full_name": f"{user.first_name} {user.last_name}".strip() or user.email,
            "skills": SkillSerializer(skills, many=True).data,
            "applications": AppSerializer(apps, many=True).data,
            "suggestions": suggestions, # New dynamic field
        })