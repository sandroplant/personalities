from django.conf import settings
from django.db import models


class ProfileVisibility(models.Model):
    """Stores per-profile visibility settings as a JSON map.

    Example data structure:
    {
      "age_group": "friends",
      "diet": "friends",
      "favorite_movies": "private",
      "city": "public"
    }
    Levels: public | friends | private
    """

    profile = models.OneToOneField(
        'userprofiles.Profile', on_delete=models.CASCADE, related_name='visibility_settings'
    )
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'userprofiles'


class InfoRequest(models.Model):
    """A request from one user to another to view a private profile section.

    Reciprocity rule is enforced in the view layer: a requester cannot create
    multiple approved-or-pending requests toward the same owner without at least
    one approved request in the opposite direction.
    """

    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_DENIED = 'DENIED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_DENIED, 'Denied'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='info_requests_received')
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='info_requests_sent')
    section_key = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = 'userprofiles'
        indexes = [
            models.Index(fields=['owner', 'requester', 'status']),
        ]
        constraints = [
            models.CheckConstraint(check=~models.Q(owner=models.F('requester')), name='info_request_not_self')
        ]

