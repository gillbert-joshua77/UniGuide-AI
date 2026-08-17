from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import ChatSession, ChatMessage
from .services.context_builder import (
    build_chat_history,
    build_student_context,
    build_system_instruction,
)
from .services.gemini_client import GeminiError

from students.models import Application, Skill

User = get_user_model()

CHAT_URL = '/api/v1/uniguide/chat/'
SESSIONS_URL = '/api/v1/uniguide/chat/sessions/'


class FakeGeminiService:
    last_system_instruction = None
    title_call_count = 0

    def __init__(self, *args, **kwargs):
        pass

    def generate_reply(self, message, history, system_instruction):
        FakeGeminiService.last_system_instruction = system_instruction
        return f'Echo: {message}'

    def generate_title(self, user_message, ai_reply):
        FakeGeminiService.title_call_count += 1
        return 'Smart title'


class TitleFallbackGeminiService(FakeGeminiService):
    def generate_title(self, user_message, ai_reply):
        return None


class TitleRaisingGeminiService(FakeGeminiService):
    def generate_title(self, user_message, ai_reply):
        raise GeminiError('title generation failed')


def fake_failing_service():
    class FailingGeminiService:
        def __init__(self, *args, **kwargs):
            pass

        def generate_reply(self, message, history, system_instruction):
            raise GeminiError('Gemini is unavailable right now. Please try again.')
    return FailingGeminiService


@override_settings(CHAT_MIN_GAP_SECONDS=0, CHAT_MAX_MESSAGES=1000)
class ChatAPITests(TestCase):

    def setUp(self):
        cache.clear()
        FakeGeminiService.title_call_count = 0
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Alex',
            last_name='Lee',
        )
        self.other = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            first_name='Other',
            last_name='User',
        )
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        cache.clear()

    def _chat_patcher(self, fail=False):
        if fail:
            return patch('ai.views.GeminiService', fake_failing_service())
        return patch('ai.views.GeminiService', FakeGeminiService)

    def test_chat_requires_authentication(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(CHAT_URL, {'message': 'hi'}, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_send_message_creates_session(self):
        with self._chat_patcher():
            resp = self.client.post(CHAT_URL, {'message': 'hello'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIn('session_id', resp.data)
        self.assertEqual(resp.data['reply'], 'Echo: hello')
        session = ChatSession.objects.get(id=resp.data['session_id'])
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.chat_messages.count(), 2)
        self.assertEqual(session.title, 'hello')

    def test_continue_same_session_single_session_created(self):
        with self._chat_patcher():
            first = self.client.post(CHAT_URL, {'message': 'hello'}, format='json')
            session_id = first.data['session_id']
            second = self.client.post(
                CHAT_URL, {'message': 'follow up', 'session_id': session_id}, format='json'
            )
            third = self.client.post(
                CHAT_URL, {'message': 'more follow up', 'session_id': session_id}, format='json'
            )
        self.assertEqual(second.data['session_id'], session_id)
        self.assertEqual(third.data['session_id'], session_id)
        self.assertEqual(ChatSession.objects.count(), 1)
        session = ChatSession.objects.get(id=session_id)
        self.assertEqual(session.chat_messages.count(), 6)

    def test_create_session_endpoint(self):
        resp = self.client.post(SESSIONS_URL, {'title': 'My Study Plan'}, format='json')
        self.assertEqual(resp.status_code, 201)
        session = ChatSession.objects.get(id=resp.data['id'])
        self.assertEqual(session.title, 'My Study Plan')
        self.assertEqual(session.user, self.user)

    def test_list_chats_only_own(self):
        own = ChatSession.objects.create(user=self.user, title='Mine')
        ChatSession.objects.create(user=self.other, title='Theirs')
        with self._chat_patcher():
            self.client.post(CHAT_URL, {'message': 'first message'})
        resp = self.client.get(CHAT_URL)
        self.assertEqual(resp.status_code, 200)
        ids = {str(s['id']) for s in resp.data}
        self.assertIn(str(own.id), ids)
        self.assertNotIn('Theirs', [s['title'] for s in resp.data])
        self.assertEqual(len(resp.data), 2)

    def test_retrieve_chat_with_messages(self):
        with self._chat_patcher():
            created = self.client.post(CHAT_URL, {'message': 'hi'}, format='json')
        session_id = created.data['session_id']
        resp = self.client.get(f'{SESSIONS_URL}{session_id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['messages']), 2)
        roles = [m['role'] for m in resp.data['messages']]
        self.assertEqual(roles, ['user', 'assistant'])

    def test_rename_chat(self):
        with self._chat_patcher():
            created = self.client.post(CHAT_URL, {'message': 'hi'}, format='json')
        session_id = created.data['session_id']
        resp = self.client.patch(
            f'{SESSIONS_URL}{session_id}/', {'title': 'Renamed'}, format='json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['title'], 'Renamed')
        self.assertEqual(
            ChatSession.objects.get(id=session_id).title, 'Renamed'
        )

    def test_delete_chat(self):
        with self._chat_patcher():
            created = self.client.post(CHAT_URL, {'message': 'hi'}, format='json')
        session_id = created.data['session_id']
        resp = self.client.delete(f'{SESSIONS_URL}{session_id}/')
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(ChatSession.objects.filter(id=session_id).exists())

    def test_cannot_access_another_users_session(self):
        with self._chat_patcher():
            created = self.client.post(CHAT_URL, {'message': 'mine'}, format='json')
        session_id = created.data['session_id']

        other_client = APIClient()
        other_client.force_authenticate(user=self.other)

        resp = other_client.get(f'{SESSIONS_URL}{session_id}/')
        self.assertEqual(resp.status_code, 404)

        resp = other_client.patch(
            f'{SESSIONS_URL}{session_id}/', {'title': 'hacked'}, format='json'
        )
        self.assertEqual(resp.status_code, 404)

        resp = other_client.delete(f'{SESSIONS_URL}{session_id}/')
        self.assertEqual(resp.status_code, 404)

        with self._chat_patcher():
            resp = other_client.post(
                CHAT_URL, {'message': 'intrude', 'session_id': session_id}, format='json'
            )
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(ChatSession.objects.get(id=session_id).user, self.user)

    def test_gemini_failure_returns_502_and_rolls_back_message(self):
        with self._chat_patcher(fail=True):
            resp = self.client.post(CHAT_URL, {'message': 'boom'}, format='json')
        self.assertEqual(resp.status_code, 502)
        self.assertIn('error', resp.data)
        self.assertEqual(ChatSession.objects.count(), 0)
        self.assertEqual(ChatMessage.objects.count(), 0)

    def test_retry_after_gemini_failure_works(self):
        fail = fake_failing_service()
        success = FakeGeminiService

        with patch('ai.views.GeminiService', fail):
            resp = self.client.post(CHAT_URL, {'message': 'boom'}, format='json')
        self.assertEqual(resp.status_code, 502)

        with patch('ai.views.GeminiService', success):
            resp = self.client.post(CHAT_URL, {'message': 'recovered'}, format='json')
        self.assertEqual(resp.status_code, 200)
        session = ChatSession.objects.get()
        self.assertEqual(session.chat_messages.count(), 2)

    @override_settings(CHAT_MAX_MESSAGES=3)
    def test_rate_limit_exceeded(self):
        key = f'uniguide_chat_count_{self.user.id}'
        cache.set(key, 3, timeout=3600)
        with self._chat_patcher():
            resp = self.client.post(CHAT_URL, {'message': 'hi'}, format='json')
        self.assertEqual(resp.status_code, 429)
        self.assertIn('retry_after', resp.data)

    def test_empty_message_rejected(self):
        resp = self.client.post(CHAT_URL, {'message': '   '}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_chat_sends_personalized_system_instruction(self):
        profile = self.user.student_profile
        profile.course = 'Data Science'
        profile.career_goal = 'ML Engineer'
        profile.save()
        Skill.objects.create(user=self.user, name='Python', percentage=90)

        with self._chat_patcher():
            resp = self.client.post(CHAT_URL, {'message': 'hello'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)

        instruction = FakeGeminiService.last_system_instruction
        self.assertIn('Data Science', instruction)
        self.assertIn('ML Engineer', instruction)
        self.assertIn('Python (90%)', instruction)


class ContextBuilderTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email='priya@example.com',
            password='testpass123',
            first_name='Priya',
            last_name='Sharma',
        )

    def test_system_instruction_includes_profile_fields(self):
        profile = self.user.student_profile
        profile.education_level = 'undergraduate'
        profile.institution = 'NIT Trichy'
        profile.course = 'Computer Science'
        profile.year_of_study = '2'
        profile.academic_performance = 'CGPA 8.9/10'
        profile.interests = 'AI, Web Development, Cybersecurity'
        profile.career_goal = 'Software Engineer'
        profile.preferred_location = 'Bangalore'
        profile.preferred_country = 'Canada'
        profile.budget = '$20,000/year'
        profile.save()

        instruction = build_system_instruction(self.user)

        self.assertIn('STUDENT PROFILE', instruction)
        self.assertIn('Priya Sharma', instruction)
        self.assertIn('NIT Trichy', instruction)
        self.assertIn('Computer Science', instruction)
        self.assertIn('CGPA 8.9/10', instruction)
        self.assertIn('Software Engineer', instruction)
        self.assertIn('AI, Web Development, Cybersecurity', instruction)

    def test_system_instruction_includes_skills_and_applications(self):
        Skill.objects.create(user=self.user, name='Python', percentage=85)
        Skill.objects.create(user=self.user, name='Django', percentage=70)
        Application.objects.create(
            user=self.user,
            role='Software Engineer Intern',
            company='Google',
            status='Interview',
            color='#22c97a',
        )

        instruction = build_system_instruction(self.user)

        self.assertIn('Python (85%)', instruction)
        self.assertIn('Django (70%)', instruction)
        self.assertIn('Software Engineer Intern at Google (Interview)', instruction)

    def test_no_profile_state(self):
        self.user.student_profile.delete()
        fresh_user = User.objects.get(pk=self.user.pk)

        instruction = build_system_instruction(fresh_user)
        self.assertIn('No student profile is saved yet', instruction)
        self.assertIsNone(build_student_context(fresh_user))

    def test_empty_profile_state(self):
        instruction = build_system_instruction(self.user)
        self.assertIn('currently empty', instruction)

    def test_system_instruction_contains_today_date(self):
        from datetime import date

        instruction = build_system_instruction(self.user)
        self.assertIn(date.today().isoformat(), instruction)

    def test_chat_history_maps_roles_and_order(self):
        session = ChatSession.objects.create(user=self.user, title='Test')
        ChatMessage.objects.create(session=session, role='user', content='hello')
        ChatMessage.objects.create(session=session, role='assistant', content='hi there')
        ChatMessage.objects.create(session=session, role='user', content='more')

        history = build_chat_history(session)

        self.assertEqual(
            [m['role'] for m in history],
            ['user', 'model', 'user'],
        )
        self.assertEqual(history[1]['parts'], ['hi there'])
