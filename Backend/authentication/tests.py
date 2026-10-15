from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

User = get_user_model()

CHANGE_PASSWORD_URL = '/api/v1/auth/change-password/'


class ChangePasswordAPITests(TestCase):
    """Regression tests for Phase 4F.2 secure password changes.

    The endpoint runs Django's configured AUTH_PASSWORD_VALIDATORS after the
    existing required-field / current-password / confirmation-match /
    minimum-eight-character checks. Existing failure responses are preserved so
    the frontend contract (400 with a string ``error``) does not change.

    Token behavior is intentionally unchanged in this phase: existing access
    and refresh tokens stay valid after a password change (Phase 4F.3 owns
    token lifecycle). The dedicated test below pins that decision.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='changer@example.com',
            password='Old-Passw0rd!',
            first_name='Casey',
            last_name='Changer',
        )
        self.client.force_authenticate(user=self.user)

    def _change(self, **payload):
        return self.client.post(CHANGE_PASSWORD_URL, payload, format='json')

    def _new_password_works(self, password):
        self.user.refresh_from_db()
        return self.user.check_password(password)

    # ─── Success ────────────────────────────────────────────────────
    def test_success_changes_password(self):
        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='Brand-New-Passw0rd!',
            confirm_password='Brand-New-Passw0rd!',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data.get('message'), 'Password changed successfully')
        self.assertTrue(self._new_password_works('Brand-New-Passw0rd!'))
        self.assertFalse(self._new_password_works('Old-Passw0rd!'))

    # ─── Existing failure cases (status + exact message preserved) ──
    def test_wrong_current_password_rejected(self):
        resp = self._change(
            old_password='Definitely-Wrong!',
            new_password='Brand-New-Passw0rd!',
            confirm_password='Brand-New-Passw0rd!',
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(resp.data.get('error'), 'Current password is incorrect')
        self.assertTrue(self._new_password_works('Old-Passw0rd!'))

    def test_mismatched_confirmation_rejected(self):
        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='Brand-New-Passw0rd!',
            confirm_password='Different-Passw0rd!',
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(resp.data.get('error'), 'New passwords do not match')
        self.assertTrue(self._new_password_works('Old-Passw0rd!'))

    def test_missing_fields_rejected(self):
        resp = self._change()
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(
            resp.data.get('error'),
            'old_password, new_password and confirm_password are required',
        )

    def test_short_password_rejected_with_existing_message(self):
        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='short7!',
            confirm_password='short7!',
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(
            resp.data.get('error'), 'New password must be at least 8 characters'
        )
        self.assertTrue(self._new_password_works('Old-Passw0rd!'))

    # ─── Configured-validator rejections ────────────────────────────
    def test_common_password_rejected(self):
        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='password123',
            confirm_password='password123',
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertIsInstance(resp.data.get('error'), str)
        self.assertTrue(resp.data.get('error'))
        self.assertTrue(self._new_password_works('Old-Passw0rd!'))

    def test_numeric_only_password_rejected(self):
        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='12345678',
            confirm_password='12345678',
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertIsInstance(resp.data.get('error'), str)
        self.assertTrue(self._new_password_works('Old-Passw0rd!'))

    def test_password_similar_to_user_details_rejected(self):
        user = User.objects.create_user(
            email='zephyrine.quill@example.com',
            password='Old-Passw0rd!',
            first_name='Zephyrine',
            last_name='Quill',
        )
        self.client.force_authenticate(user=user)
        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='Zephyrine',
            confirm_password='Zephyrine',
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertIsInstance(resp.data.get('error'), str)
        user.refresh_from_db()
        self.assertTrue(user.check_password('Old-Passw0rd!'))

    # ─── Authentication ─────────────────────────────────────────────
    def test_unauthenticated_rejected(self):
        anon = APIClient()
        resp = anon.post(
            CHANGE_PASSWORD_URL,
            {
                'old_password': 'Old-Passw0rd!',
                'new_password': 'Brand-New-Passw0rd!',
                'confirm_password': 'Brand-New-Passw0rd!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 401, resp.data)

    # ─── Explicitly chosen token behavior (deferred to Phase 4F.3) ──
    def test_existing_tokens_remain_valid_after_password_change(self):
        # Pre-change tokens, as issued by the login/registration flow.
        tokens = self.user.tokens()
        access = tokens['access']
        refresh = tokens['refresh']

        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='Brand-New-Passw0rd!',
            confirm_password='Brand-New-Passw0rd!',
        )
        self.assertEqual(resp.status_code, 200, resp.data)

        # Phase 4F.2 does not touch token state: both tokens still verify and
        # the refresh token can still mint a new access token.
        self.assertIsNotNone(AccessToken(access))
        rotated = RefreshToken(refresh).access_token
        self.assertIsNotNone(AccessToken(str(rotated)))
