from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
import os
import shutil
import tempfile
from rest_framework.test import APIClient

from .models import SavedOpportunity, StudentProfile

User = get_user_model()


def make_test_image(filename='pic.png'):
    buf = io.BytesIO()
    Image.new('RGB', (32, 32), (0, 180, 216)).save(buf, format='PNG')
    return SimpleUploadedFile(filename, buf.getvalue(), content_type='image/png')


TEST_MEDIA_ROOT = tempfile.mkdtemp(prefix='uniguide_test_media_')


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class StudentProfileAPITests(TestCase):

    def setUp(self):
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
        self.url = '/api/v1/students/profile/'

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 401)

    def test_profile_auto_created_on_signup(self):
        self.assertTrue(StudentProfile.objects.filter(user=self.user).exists())

    def test_get_returns_own_profile(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['email'], 'student@example.com')
        self.assertEqual(resp.data['full_name'], 'Alex Lee')

    def test_update_profile(self):
        data = {
            'education_level': 'undergraduate',
            'institution': 'State University',
            'course': 'Computer Science',
            'year_of_study': '3',
            'academic_performance': 'CGPA 8.5',
            'interests': 'AI, Machine Learning',
            'career_goal': 'ML Engineer',
            'preferred_location': 'Remote',
            'preferred_country': 'Canada',
            'budget': '$20,000/year',
            'bio': 'Looking for MS programs',
        }
        resp = self.client.put(self.url, data, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)
        profile = StudentProfile.objects.get(user=self.user)
        self.assertEqual(profile.education_level, 'undergraduate')
        self.assertEqual(profile.career_goal, 'ML Engineer')
        self.assertEqual(resp.data['budget'], '$20,000/year')

    def test_invalid_education_level_rejected(self):
        resp = self.client.put(
            self.url, {'education_level': 'not-a-real-level'}, format='json'
        )
        self.assertEqual(resp.status_code, 400)

    def test_cannot_access_another_users_profile(self):
        other_profile = StudentProfile.objects.get(user=self.other)
        other_profile.course = 'Engineering'
        other_profile.career_goal = 'Civil Engineer'
        other_profile.save()
        # Profile endpoints are per-authenticated-user, so no id routing exists;
        # make sure the request only ever returns the caller's own profile.
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertNotEqual(resp.data.get('career_goal'), 'Civil Engineer')
        self.assertIsNone(resp.data.get('career_goal') or None)

        self.assertNotEqual(StudentProfile.objects.get(user=self.user).id, other_profile.id)

    def test_profile_picture_persists_after_form_save(self):
        # Upload a picture (multipart PUT) — must be stored and returned.
        upload = self.client.put(self.url, {'profile_picture': make_test_image()}, format='multipart')
        self.assertEqual(upload.status_code, 200, upload.data)
        first_url = upload.data.get('profile_picture')
        self.assertIsNotNone(first_url)

        # Saving the rest of the form echoes the URL back as a string;
        # it must NOT wipe the picture.
        save = self.client.put(
            self.url,
            {
                'first_name': 'Alex',
                'last_name': 'Lee',
                'institution': 'State University',
                'course': 'Computer Science',
                'bio': 'Hello',
                'profile_picture': first_url,
            },
            format='json',
        )
        self.assertEqual(save.status_code, 200, save.data)
        self.assertEqual(save.data.get('profile_picture'), first_url)

        profile = StudentProfile.objects.get(user=self.user)
        self.assertTrue(profile.profile_picture.name)
        profile.profile_picture.delete(save=False)

    def test_upload_profile_picture_success(self):
        resp = self.client.put(
            self.url, {'profile_picture': make_test_image('upload.png')}, format='multipart'
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIsNotNone(resp.data.get('profile_picture'))
        profile = StudentProfile.objects.get(user=self.user)
        self.assertTrue(profile.profile_picture.name)
        self.assertTrue(profile.profile_picture.storage.exists(profile.profile_picture.name))

    def test_invalid_upload_rejected(self):
        bad = SimpleUploadedFile('note.txt', b'not an image', content_type='text/plain')
        resp = self.client.put(self.url, {'profile_picture': bad}, format='multipart')
        self.assertEqual(resp.status_code, 400, resp.data)
        profile = StudentProfile.objects.get(user=self.user)
        self.assertFalse(profile.profile_picture)

    def test_missing_profile_picture_preserves_existing(self):
        upload = self.client.put(
            self.url, {'profile_picture': make_test_image()}, format='multipart'
        )
        self.assertEqual(upload.status_code, 200, upload.data)
        saved_url = upload.data.get('profile_picture')
        # A later form save without a picture must not wipe it.
        resp = self.client.put(self.url, {'bio': 'Hello'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data.get('profile_picture'), saved_url)
        profile = StudentProfile.objects.get(user=self.user)
        self.assertTrue(profile.profile_picture.name)

    def test_null_profile_picture_ignored(self):
        upload = self.client.put(
            self.url, {'profile_picture': make_test_image()}, format='multipart'
        )
        self.assertEqual(upload.status_code, 200, upload.data)
        saved_url = upload.data.get('profile_picture')
        # Contract: JSON `null` is skipped (not used to clear the picture).
        resp = self.client.put(self.url, {'profile_picture': None}, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data.get('profile_picture'), saved_url)


class SavedOpportunityAPITests(TestCase):
    """Regression tests for the saved-opportunities P1 (QA TEST_CASES H1-H8).

    Covers string/numeric ids, duplicate-save semantics, per-user uniqueness,
    cross-user isolation, invalid input handling, listing, and deletion.
    """

    def setUp(self):
        self.client = APIClient(HTTP_HOST='localhost')
        self.user = User.objects.create_user(
            email='saver@example.com',
            password='testpass123',
            first_name='Sam',
            last_name='Saver',
        )
        self.other = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            first_name='Other',
            last_name='User',
        )
        self.client.force_authenticate(user=self.user)
        self.url = '/api/v1/students/saved-opportunities/'
        self.payload = {
            'opportunity_id': '27282',
            'source': 'hackathon',
            'title': 'Sample Hackathon',
            'url': 'https://devpost.com/software/sample-hackathon',
            'organizer': 'Devpost',
        }

    def _other_client(self):
        client = APIClient(HTTP_HOST='localhost')
        client.force_authenticate(user=self.other)
        return client

    def test_saves_string_id(self):
        resp = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data['opportunity_id'], '27282')
        self.assertEqual(
            SavedOpportunity.objects.filter(
                user=self.user, opportunity_id='27282'
            ).count(),
            1,
        )

    def test_numeric_id_saves_without_500(self):
        resp = self.client.post(
            self.url, {**self.payload, 'opportunity_id': 555}, format='json'
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data['opportunity_id'], '555')
        self.assertEqual(
            SavedOpportunity.objects.filter(user=self.user, opportunity_id='555').count(),
            1,
        )

    def test_duplicate_save_returns_existing_and_no_duplicate(self):
        first = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(first.status_code, 201, first.data)
        second = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(second.data['id'], first.data['id'])
        self.assertEqual(
            SavedOpportunity.objects.filter(
                user=self.user, opportunity_id='27282'
            ).count(),
            1,
        )

    def test_duplicate_with_whitespace_normalized(self):
        self.client.post(self.url, self.payload, format='json')
        resp = self.client.post(
            self.url, {**self.payload, 'opportunity_id': '  27282  '}, format='json'
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(
            SavedOpportunity.objects.filter(
                user=self.user, opportunity_id='27282'
            ).count(),
            1,
        )

    def test_different_users_can_save_same_opportunity(self):
        resp_a = self.client.post(
            self.url, {**self.payload, 'opportunity_id': 555}, format='json'
        )
        self.assertEqual(resp_a.status_code, 201, resp_a.data)
        resp_b = self._other_client().post(
            self.url, {**self.payload, 'opportunity_id': 555}, format='json'
        )
        self.assertEqual(resp_b.status_code, 201, resp_b.data)
        self.assertEqual(
            SavedOpportunity.objects.filter(opportunity_id='555').count(), 2
        )

    def test_invalid_opportunity_ids_rejected(self):
        invalid_values = ['', '   ', None, True, False, 12.5, [1, 2], {'id': 1}]
        for bad in invalid_values:
            with self.subTest(bad=bad):
                resp = self.client.post(
                    self.url, {**self.payload, 'opportunity_id': bad}, format='json'
                )
                self.assertEqual(resp.status_code, 400, resp.data)

        missing = {k: v for k, v in self.payload.items() if k != 'opportunity_id'}
        resp = self.client.post(self.url, missing, format='json')
        self.assertEqual(resp.status_code, 400, resp.data)

    def test_overlong_opportunity_id_rejected(self):
        resp = self.client.post(
            self.url, {**self.payload, 'opportunity_id': '9' * 101}, format='json'
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(SavedOpportunity.objects.count(), 0)

    def test_list_returns_only_own_records(self):
        self.client.post(self.url, self.payload, format='json')
        self.client.post(
            self.url,
            {**self.payload, 'opportunity_id': '99999', 'title': 'Second'},
            format='json',
        )
        self._other_client().post(
            self.url, {**self.payload, 'opportunity_id': '11111'}, format='json'
        )

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(len(resp.data), 2)
        self.assertEqual({row['opportunity_id'] for row in resp.data}, {'27282', '99999'})

        resp = self._other_client().get(self.url)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['opportunity_id'], '11111')

    def test_owner_can_delete_own_record(self):
        saved = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(saved.status_code, 201, saved.data)
        pk = saved.data['id']
        resp = self.client.delete(f"{self.url}{pk}/")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertFalse(SavedOpportunity.objects.filter(pk=pk).exists())

    def test_other_user_cannot_delete_your_record(self):
        saved = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(saved.status_code, 201, saved.data)
        pk = saved.data['id']
        resp = self._other_client().delete(f"{self.url}{pk}/")
        self.assertEqual(resp.status_code, 404)
        self.assertTrue(SavedOpportunity.objects.filter(pk=pk).exists())

    def test_requires_authentication(self):
        anon = APIClient(HTTP_HOST='localhost')
        resp = anon.post(self.url, self.payload, format='json')
        self.assertEqual(resp.status_code, 401)
        resp = anon.get(self.url)
        self.assertEqual(resp.status_code, 401)
