from django.conf import settings
from django.db import models
from django.db.models import Q

STATUS_PENDING = "PENDING"
STATUS_APPROVED = "APPROVED"
STATUS_DENIED = "DENIED"


User = settings.AUTH_USER_MODEL


class ProfileExtraFieldsMixin(models.Model):
    """
    Mixin to extend the existing Profile model without modifying it directly here.
    Add these fields to your Profile model or use multi-table inheritance.
    """

    # Per-field visibility map: { field_name: "public"|"friends"|"private" }
    visibility = models.JSONField(default=dict, blank=True)

    # Reserved for objectivity work; kept here to avoid separate PRs later
    self_ratings = models.JSONField(default=dict, blank=True)
    predicted_ratings = models.JSONField(default=dict, blank=True)

    class Meta:
        abstract = True


class Friendship(models.Model):
    """
    Mutual friendship between two users. Store unordered pairs; enforce uniqueness.
    For the first iteration we only persist accepted friendships.
    """

    user_a = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="friendships_a"
    )
    user_b = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="friendships_b"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user_a", "user_b"], name="unique_friendship_ordered"
            ),
        ]

    def save(self, *args, **kwargs):
        # Ensure ordered storage to enforce uniqueness independent of order
        if self.user_a_id > self.user_b_id:
            self.user_a_id, self.user_b_id = self.user_b_id, self.user_a_id
        super().save(*args, **kwargs)

    @classmethod
    def are_friends(cls, u1_id: int, u2_id: int) -> bool:
        if u1_id == u2_id:
            return True
        a, b = (u1_id, u2_id) if u1_id < u2_id else (u2_id, u1_id)
        return cls.objects.filter(user_a_id=a, user_b_id=b).exists()


class ProfileRequest(models.Model):
    """
    Request to reveal a private profile section.
    owner: the profile owner being asked to share
    requester: the user who is asking
    section: name of the field/section
    status: pending/approved/denied/cancelled
    """

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_DENIED = "denied"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, STATUS_PENDING),
        (STATUS_APPROVED, STATUS_APPROVED),
        (STATUS_DENIED, STATUS_DENIED),
        (STATUS_CANCELLED, STATUS_CANCELLED),
    ]

    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="incoming_profile_requests"
    )
    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="outgoing_profile_requests"
    )
    section = models.CharField(max_length=64)
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "requester", "section"],
                name="unique_open_request_per_section",
                condition=Q(status=STATUS_PENDING),
            )
        ]

    def can_view_after_approval(self, viewer_id: int) -> bool:
        return self.status == self.STATUS_APPROVED and self.requester_id == viewer_id
