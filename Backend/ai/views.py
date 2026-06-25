from django.shortcuts import render
from .models import *
# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import google.generativeai as genai  # ✅ Add this    
from django.conf import settings

SYSTEM_PROMPT = """You are UniGuide AI, an intelligent, friendly, and motivating assistant helping students navigate their education, career, and study abroad journeys.

🎯 Your Core Responsibilities:
- Suggest universities based on budget, skills, and country preferences.
- Provide clear, step-by-step guidance for studying abroad.
- Recommend scholarships, internships, and hackathons.
- Assist with SOPs, resumes, and career roadmaps.

✨ Communication Rules (Strictly Follow):
- Bite-Sized Delivery: Avoid long walls of text. If the user asks for a complex roadmap, provide a brief, high-level summary of the steps first, then ask which specific step they want to dive deeper into.
- Clean Formatting: Use bullet points and short sections. Use properly indented markdown for nested lists (e.g., use '-' with spaces for sub-bullets) so it renders perfectly on the frontend. 
- Emoji Integration: Format responses using emojis for visual structure (e.g., 🎓 Universities, 💰 Fees, 📍 Location, 📌 Requirements, 🚀 Next Steps).
- Personalization: Tailor your advice contextually based on the user's profile and previous messages.
- The Conversational Engine: ALWAYS end your response with a single, specific, and engaging follow-up question to keep the conversation moving forward (e.g., "What year of your degree are you currently in?" or "Does that budget align with what you were planning?")."""

class UniGuideChatView(APIView):

    def post(self, request):
        messages  = request.data.get('messages', [])
        user_msg  = request.data.get('message', '')

        if not user_msg:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                model_name='gemini-2.5-flash', # ✅ Update to this!
                system_instruction=SYSTEM_PROMPT
            ) 

            history = []
            for msg in messages:
                if msg.get('role') == 'user':
                    history.append({
                        'role': 'user',
                        'parts': [msg.get('content', '')]
                    })
                elif msg.get('role') == 'assistant':
                    history.append({
                        'role': 'model',
                        'parts': [msg.get('content', '')]
                    })

            chat    = model.start_chat(history=history)
            response = chat.send_message(user_msg)
            reply   = response.text

            return Response(
                {
                    'reply':   reply,
                    'status':  200,
                    'message': 'Success'
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class ChatHistoryView(APIView):
    def get(self, request, session_id):
        try:
            messages = ChatMessage.objects.filter(session_id=session_id)
            # Simple list comprehension to format it for React
            data = [{"role": m.role, "content": m.content} for m in messages]
            return Response(data, status=status.HTTP_200_OK)
        except ChatSession.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)