"""
API views for the questions app. Expose endpoints to list/create questions,
list tags, and submit answers.

The list view supports sorting by “trending” (default) or “recent,” and always
annotates yes/no counts and rating stats so the serializer fields are present.
"""

from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404

from rest_framework import filters, generics, permissions, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.reactions import build_breakdown

from .models import Answer, Question, QuestionReaction, AnswerReaction, Tag
from .serializers import (
    AnswerReactionSerializer,
    AnswerSerializer,
    QuestionReactionSerializer,
    QuestionSerializer,
    TagSerializer,
)


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


class QuestionReactionView(generics.GenericAPIView):
    """Create/update and retrieve reactions for a question."""

    serializer_class = QuestionReactionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self) -> Question:
        return get_object_or_404(Question, pk=self.kwargs["pk"])

    def get(self, request, *args, **kwargs):
        question = self.get_object()
        rows = list(QuestionReaction.objects.filter(question=question).values("user_id", *QuestionReaction.DIMENSIONS))
        breakdown = build_breakdown(rows)
        user_reaction = None
        if request.user and request.user.is_authenticated:
            reaction = QuestionReaction.objects.filter(question=question, user=request.user).first()
            if reaction:
                user_reaction = self.get_serializer(reaction).data
        payload = {
            "question_id": question.id,
            "scores": {field: getattr(question, f"{field}_score") for field in QuestionReaction.DIMENSIONS},
            "breakdown": breakdown,
            "user_reaction": user_reaction,
        }
        return Response(payload)

    def post(self, request, *args, **kwargs):
        question = self.get_object()
        self.check_object_permissions(request, question)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        defaults = {field: serializer.validated_data.get(field, 0) for field in QuestionReaction.DIMENSIONS}
        reaction, created = QuestionReaction.objects.update_or_create(
            question=question,
            user=request.user,
            defaults=defaults,
        )
        data = self.get_serializer(reaction).data
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(data, status=status_code)


class AnswerReactionView(generics.GenericAPIView):
    """Create/update and retrieve reactions for an answer."""

    serializer_class = AnswerReactionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self) -> Answer:
        return get_object_or_404(Answer, pk=self.kwargs["pk"])

    def get(self, request, *args, **kwargs):
        answer = self.get_object()
        rows = list(AnswerReaction.objects.filter(answer=answer).values("user_id", *AnswerReaction.DIMENSIONS))
        breakdown = build_breakdown(rows)
        user_reaction = None
        if request.user and request.user.is_authenticated:
            reaction = AnswerReaction.objects.filter(answer=answer, user=request.user).first()
            if reaction:
                user_reaction = self.get_serializer(reaction).data
        payload = {
            "answer_id": answer.id,
            "scores": {field: getattr(answer, f"{field}_score") for field in AnswerReaction.DIMENSIONS},
            "breakdown": breakdown,
            "user_reaction": user_reaction,
        }
        return Response(payload)

    def post(self, request, *args, **kwargs):
        answer = self.get_object()
        self.check_object_permissions(request, answer)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        defaults = {field: serializer.validated_data.get(field, 0) for field in AnswerReaction.DIMENSIONS}
        reaction, created = AnswerReaction.objects.update_or_create(
            answer=answer,
            user=request.user,
            defaults=defaults,
        )
        data = self.get_serializer(reaction).data
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(data, status=status_code)
