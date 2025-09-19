"""
API views for the questions app. Expose endpoints to list/create questions,
list tags, and submit answers.

The list view supports sorting by “trending” (default) or “recent,” and always
annotates yes/no counts and rating stats so the serializer fields are present.
"""

from django.db.models import Avg, Count, Q

from rest_framework import filters, generics, permissions
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import ValidationError

from .models import Question, Tag
from .serializers import AnswerSerializer, QuestionSerializer, TagSerializer


class TagListView(generics.ListAPIView):
    """Return a list of available tags for questions."""

    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class QuestionListCreateView(generics.ListCreateAPIView):
    """List existing questions or create a new one."""

    serializer_class = QuestionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["text"]

    def get_queryset(self):
        """
        Return questions with yes/no counts and rating stats annotated, then sort.

        - sort=recent → order by -created_at
        - default (trending) → order by -answer_count, -created_at
        - optional filter: ?tag=<id>
        """
        qs = Question.objects.all()

        # Filter by tag if provided
        tag_id = self.request.query_params.get("tag")
        if tag_id:
            qs = qs.filter(tag_id=tag_id)

        # Always annotate counts/stats used by the serializer
        qs = qs.annotate(
            yes_count=Count("answers", filter=Q(answers__selected_option_index=0)),
            no_count=Count("answers", filter=Q(answers__selected_option_index=1)),
            average_rating=Avg("answers__rating"),
            rating_count=Count("answers", filter=Q(answers__rating__isnull=False)),
            answer_count=Count("answers"),
        )

        # Determine ordering
        sort_param = self.request.query_params.get("sort", "").lower()
        if sort_param == "recent":
            return qs.order_by("-created_at")

        # Default: trending sort by answer count then recency
        return qs.order_by("-answer_count", "-created_at")

    def perform_create(self, serializer):
        """Create a new question, normalizing tags and checking for duplicates."""
        text_raw = serializer.validated_data.get("text", "")
        text_norm = str(text_raw).strip().lower()

        # Duplicate check (case-insensitive)
        if Question.objects.filter(text__iexact=text_norm).exists():
            raise ValidationError({"text": "A similar question already exists. Please rephrase your question."})

        # Normalize/create tag if tag_name provided and tag not already set
        tag_name = self.request.data.get("tag_name") or self.request.data.get("tag")
        if tag_name and not serializer.validated_data.get("tag"):
            normalized = str(tag_name).strip().lower()
            if normalized:
                tag_obj, _ = Tag.objects.get_or_create(name=normalized)
                serializer.validated_data["tag"] = tag_obj

        serializer.save()

    def get_serializer_context(self):
        # Ensure serializer has request for author attachment in create()
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class AnswerCreateView(generics.CreateAPIView):
    """Create a new answer to a question."""

    serializer_class = AnswerSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
