from django.contrib.auth.models import AbstractUser
from django.db import models


# Custom User Model
class User(AbstractUser):
    email = models.EmailField(unique=True)  # ensure unique email
    # Fields expected by tests:
    spotify_id = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    display_name = models.CharField(max_length=100, blank=True)
    coin_balance = models.PositiveIntegerField(default=0)

    class Meta:
        app_label = "core"

    def __str__(self):
        # Prefer display_name when set
        return self.display_name or self.username
