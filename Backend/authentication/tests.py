from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

User = get_user_model()

CHANGE_PASSWORD_URL = '/api/v1/auth/change-password/'
TOKEN_REFRESH_URL = '/api/v1/auth/token/refresh/'


class ChangePasswordAPITests(TestCase):
    """Regression tests for Phase 4F.2 secure password changes.

    The endpoint runs Django's configured AUTH_PASSWORD_VALIDATORS after the
    existing required-field / current-password / confirmation-match /
    minimum-eight-character checks. Existing failure responses are preserved so
    the frontend contract (400 with a string ``error``) does not change.

    Phase 4F.3 token behaviour: after a successful password change all
    outstanding refresh tokens for the user are blacklisted. Already-issued
    access tokens remain valid for the remainder of their 60-minute lifetime
    (stateless JWTs cannot be revoked without a token-introspection layer;
    this is an accepted residual risk documented in TEST_CASES.md C12 and the
    SIMPLE_JWT ACCESS_TOKEN_LIFETIME setting).
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

    # ─── Phase 4F.3: token invalidation after password change ───────
    def test_refresh_token_blacklisted_after_password_change(self):
        """The pre-change refresh token must be blacklisted after a successful
        password change so it can no longer mint new access tokens."""
        tokens = self.user.tokens()
        refresh_str = tokens['refresh']

        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='Brand-New-Passw0rd!',
            confirm_password='Brand-New-Passw0rd!',
        )
        self.assertEqual(resp.status_code, 200, resp.data)

        # The pre-change refresh token must now be blacklisted.
        with self.assertRaises(TokenError):
            RefreshToken(refresh_str)

    def test_access_token_still_valid_after_password_change(self):
        """Pre-change access tokens remain valid for the remainder of their
        60-minute lifetime after a password change. Access tokens are stateless
        JWTs — they cannot be revoked without a token-introspection layer.
        This is an accepted residual risk (see TEST_CASES.md C12)."""
        tokens = self.user.tokens()
        access_str = tokens['access']

        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='Brand-New-Passw0rd!',
            confirm_password='Brand-New-Passw0rd!',
        )
        self.assertEqual(resp.status_code, 200, resp.data)

        # The pre-change access token must still decode (it is still within its
        # 60-minute TTL). This documents the known limitation explicitly.
        decoded = AccessToken(access_str)
        self.assertIsNotNone(decoded)

    def test_password_change_invalidates_all_outstanding_refresh_tokens(self):
        """All outstanding refresh tokens for the user — not just the current
        session's — must be blacklisted after a password change."""
        # Issue two distinct refresh tokens (simulating two login sessions).
        tokens_a = self.user.tokens()
        tokens_b = self.user.tokens()
        refresh_a = tokens_a['refresh']
        refresh_b = tokens_b['refresh']

        resp = self._change(
            old_password='Old-Passw0rd!',
            new_password='Brand-New-Passw0rd!',
            confirm_password='Brand-New-Passw0rd!',
        )
        self.assertEqual(resp.status_code, 200, resp.data)

        # Both tokens must now raise TokenError (blacklisted).
        with self.assertRaises(TokenError):
            RefreshToken(refresh_a)
        with self.assertRaises(TokenError):
            RefreshToken(refresh_b)

        # The BlacklistedToken table must have entries for this user.
        blacklisted_count = BlacklistedToken.objects.filter(
            token__user=self.user
        ).count()
        self.assertGreaterEqual(blacklisted_count, 2)


class TokenRotationTests(TestCase):
    """Tests for ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION behaviour
    added in Phase 4F.3 (settings.py SIMPLE_JWT).

    Every call to POST /auth/token/refresh/ must:
      1. Return both a new ``access`` token and a new ``refresh`` token.
      2. Blacklist the old refresh token so it cannot be reused.
      3. Accept the newly-issued refresh token on a subsequent call.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='rotator@example.com',
            password='Old-Passw0rd!',
            first_name='Rex',
            last_name='Rotator',
        )
        tokens = self.user.tokens()
        self.refresh_str = tokens['refresh']

    def _refresh(self, token):
        return self.client.post(TOKEN_REFRESH_URL, {'refresh': token}, format='json')

    def test_refresh_issues_new_access_and_refresh_tokens(self):
        """POST /auth/token/refresh/ must return both ``access`` and ``refresh``
        when ROTATE_REFRESH_TOKENS is True."""
        resp = self._refresh(self.refresh_str)
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertTrue(resp.data['access'])
        self.assertTrue(resp.data['refresh'])

    def test_used_refresh_token_is_blacklisted_after_rotation(self):
        """After a successful refresh the consumed token must be blacklisted so
        that replaying it returns 401 (BLACKLIST_AFTER_ROTATION=True)."""
        resp = self._refresh(self.refresh_str)
        self.assertEqual(resp.status_code, 200, resp.data)

        # Replaying the original refresh token must now fail.
        replay = self._refresh(self.refresh_str)
        self.assertEqual(replay.status_code, 401, replay.data)

    def test_new_refresh_token_is_accepted_after_rotation(self):
        """The rotated refresh token returned by /token/refresh/ must itself be
        accepted for a further refresh."""
        resp = self._refresh(self.refresh_str)
        self.assertEqual(resp.status_code, 200, resp.data)

        new_refresh = resp.data['refresh']
        second = self._refresh(new_refresh)
        self.assertEqual(second.status_code, 200, second.data)
        self.assertIn('access', second.data)
