# posts/models.py

from django.conf import settings
from django.db import models


class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts_post_author",  # Updated to avoid conflict
    )
    title = models.CharField(max_length=255)
    content = models.TextField()

    def __str__(self):
        return self.title
