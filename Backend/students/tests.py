from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from .models import StudentProfile

User = get_user_model()


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

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 401)

    def test_get_creates_empty_profile(self):
        self.assertFalse(StudentProfile.objects.filter(user=self.user).exists())
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(StudentProfile.objects.filter(user=self.user).exists())
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
        other_profile = StudentProfile.objects.create(
            user=self.other,
            course='Engineering',
            career_goal='Civil Engineer',
        )
        # Profile endpoints are per-authenticated-user, so no id routing exists;
        # make sure the request only ever returns the caller's own profile.
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertNotEqual(resp.data.get('career_goal'), 'Civil Engineer')
        self.assertIsNone(resp.data.get('career_goal') or None)

        self.assertNotEqual(StudentProfile.objects.get(user=self.user).id, other_profile.id)
