# core/tests.py

from django.test import TestCase, Client
from django.urls import reverse
from .models import User

class ProfileAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create(
            spotify_id='test_spotify_id',
            display_name='Test User',
            email='test@example.com'
        )
        self.client.session['user_id'] = str(self.user.id)
        self.client.session.save()

    def test_get_user_profile(self):
        response = self.client.get(reverse('get_user_profile_api'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['display_name'], 'Test User')

    def test_update_user_profile(self):
        data = {
            'display_name': 'Updated User',
            'email': 'updated@example.com'
        }
        response = self.client.post(reverse('update_user_profile_api'), data, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.display_name, 'Updated User')
        self.assertEqual(self.user.email, 'updated@example.com')
