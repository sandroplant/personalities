"""
API views for the questions app.  These views expose endpoints to list
and create questions, list tags, and submit answers.

The list view supports sorting by “trending” (default) or “recent,”
aggregates answer counts, detects duplicate questions on creation, and
normalizes tags when a new question is posted.
"""

from rest_framework import generics, permissions, filters
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import ValidationError
from django.db.models import Count

from .models import Tag, Question
from .serializers import TagSerializer, QuestionSerializer, AnswerSerializer


class TagListView(generics.ListAPIView):
    """Return a list of available tags for questions."""

    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class QuestionListCreateView(generics.ListCreateAPIView):
    """List existing questions or create a new one.

    GET: Returns a paginated list of questions. Supports optional search via
    query parameter ``search``, filtering by tag id via ``tag``, and
    sorting by ``sort=recent`` to order by creation date.  Without the
    sort parameter, questions are ranked by answer count (trending) then
    by creation date.

    POST: Accepts ``text``, optional ``tag_id``, optional list of
    ``options`` (max 4 items) and an ``is_anonymous`` flag.  If
    ``options`` is omitted or empty the frontend should treat the
    question as a yes/no poll. Duplicate questions (case-insensitive)
    are rejected. If ``tag_name`` is supplied instead of ``tag_id``,
    the tag is normalized (lower-case, trimmed) and created if it does
    not already exist.
    """

    serializer_class = QuestionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["text"]

    def get_queryset(self):
        """
        Return questions sorted by trending or recency.

        If the query parameter ``sort=recent`` is provided, the list is
        ordered by creation date (newest first).  Otherwise, questions
        are annotated with an ``answer_count`` and ordered by this count
        (descending) followed by creation date, so more‑answered (trending)
        questions appear first.  A ``tag`` query parameter restricts the
        results to a given category.
        """
        queryset = Question.objects.all()

        # Filter by tag if provided
        tag_id = self.request.query_params.get("tag")
        if tag_id:
            queryset = queryset.filter(tag_id=tag_id)

        # Determine ordering
        sort_param = self.request.query_params.get("sort", "").lower()
        if sort_param == "recent":
            return queryset.order_by("-created_at")

        # Default: trending sort by answer count then recency
        return queryset.annotate(answer_count=Count("answers")).order_by(
            "-answer_count", "-created_at"
        )

    def perform_create(self, serializer):
        """Create a new question, normalize tags, and check for duplicates."""
        text = serializer.validated_data.get("text", "").strip().lower()
        # Check for duplicate questions (case-insensitive)
        if Question.objects.filter(text__iexact=text).exists():
            raise ValidationError(
                {
                    "text": (
                        "A similar question already exists. Please rephrase"
                        " your question."
                    )
                }
            )

        # If the request included a raw tag name, normalize it and either
        # retrieve or create a Tag object. We accept both "tag_name" and
        # "tag" as possible parameter keys for convenience. Only populate
        # this if the serializer hasn't already resolved tag_id to a Tag.
        tag_name = self.request.data.get("tag_name") or self.request.data.get(
            "tag"
        )
        if tag_name and not serializer.validated_data.get("tag"):
            normalized = str(tag_name).strip().lower()
            if normalized:
                tag_obj, _created = Tag.objects.get_or_create(name=normalized)
                serializer.validated_data["tag"] = tag_obj

        return serializer.save()


class AnswerCreateView(generics.CreateAPIView):
    """Create a new answer to a question."""

    serializer_class = AnswerSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
