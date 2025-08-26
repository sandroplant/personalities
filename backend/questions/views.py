"""
API views for the questions app.  These views expose endpoints to list
and create questions, list tags, and submit answers.

At present, the list view aggregates yes/no counts on each question and
orders by recency.  Duplicate question detection and more advanced
filtering are left for future iterations.
"""

from rest_framework import generics, permissions, filters
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import ValidationError
from django.db.models import Count

from .models import Tag, Question, Answer
from .serializers import TagSerializer, QuestionSerializer, AnswerSerializer


class TagListView(generics.ListAPIView):
    """Return a list of available tags for questions."""

    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class QuestionListCreateView(generics.ListCreateAPIView):
    """List existing questions or create a new one.

    GET: Returns a paginated list of questions with aggregated yes/no
    counts.  Supports optional search via query parameter ``search`` and
    filtering by tag id via ``tag``.

    POST: Accepts ``text``, optional ``tag_id``, optional list of
    ``options`` (max 4 items) and an ``is_anonymous`` flag.  If
    ``options`` is omitted or empty the frontend should treat the
    question as a yes/no poll.
    """

    serializer_class = QuestionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["text"]

    def get_queryset(self):
        queryset = (
            Question.objects.annotate(answer_count=Count("answers"))
            .order_by("-answer_count", "-created_at")
        )
        tag_id = self.request.query_params.get("tag")
        if tag_id:
            queryset = queryset.filter(tag_id=tag_id)
        return queryset


    def perform_create(self, serializer):
        text = serializer.validated_data.get("text", "").strip().lower()
        if Question.objects.filter(text__iexact=text).exists():
            raise ValidationError(
                {"text": "A similar question already exists. Please rephrase your question."}
            )
        return serializer.save()


class AnswerCreateView(generics.CreateAPIView):
    """Create a new answer to a question."""

    serializer_class = AnswerSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
