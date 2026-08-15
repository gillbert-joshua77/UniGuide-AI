from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import ChatSession, ChatMessage
from .services.gemini_client import GeminiError

User = get_user_model()

CHAT_URL = '/api/v1/uniguide/chat/'
SESSIONS_URL = '/api/v1/uniguide/chat/sessions/'


class FakeGeminiService:
    def __init__(self, *args, **kwargs):
        pass

    def generate_reply(self, message, history, system_instruction):
        return f'Echo: {message}'


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
