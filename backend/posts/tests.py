from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from posts.models import Comment, Post


class CommentReactionApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user1 = User.objects.create_user("rose", email="rose@example.com", password="pass1234")
        self.user2 = User.objects.create_user("daisy", email="daisy@example.com", password="pass1234")
        self.post = Post.objects.create(author=self.user1, title="Demo", content="Body")
        self.comment = Comment.objects.create(post=self.post, author=self.user2, content="Nice post!")

    def test_comment_reactions_breakdown_and_update(self):
        url = reverse("comment-reactions", args=[self.comment.id])

        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(url, {"quality": 1, "safety": 1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.quality_score, 1.0)
        self.assertEqual(self.comment.safety_score, 1.0)

        self.client.force_authenticate(user=self.user2)
        resp = self.client.post(url, {"quality": -1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        self.comment.refresh_from_db()
        self.assertEqual(self.comment.quality_score, 0.0)

        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        self.assertEqual(data["breakdown"]["quality"]["positive"], 1)
        self.assertEqual(data["breakdown"]["quality"]["negative"], 1)
        self.assertEqual(data["user_reaction"]["quality"], -1)

        # Updating existing reaction should succeed without duplicating rows
        resp = self.client.post(url, {"quality": 0, "humor": 1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.humor_score, 0.5)
