"""API views for the questions app."""

from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Avg, Count, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from rest_framework import filters, generics, permissions, views
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from userprofiles.models import Profile

from .models import Question, Tag
from .serializers import (
    AnswerSerializer,
    QuestionReportSerializer,
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
        """Create a new question while enforcing quotas, pricing, and targeting."""
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

        targeting = serializer.validated_data.get("targeting_criteria") or {}
        eligible_count = self._validate_audience(targeting)

        today = timezone.localdate()
        user = self.request.user

        free_limit = getattr(settings, "QUESTIONS_DAILY_FREE_LIMIT", 3)
        paid_cost = getattr(settings, "QUESTIONS_PAID_COIN_COST", 10)
        targeted_cost = getattr(settings, "QUESTIONS_TARGETED_COIN_COST", paid_cost)
        coin_price = Decimal(str(getattr(settings, "QUESTIONS_COIN_PRICE", "0.10")))

        free_used = Question.objects.filter(
            author=user,
            quota_date=today,
            used_free_allowance=True,
        ).count()

        requires_payment = free_used >= free_limit
        coins_spent = 0
        price_spent = Decimal("0")
        used_free = True

        if requires_payment:
            coins_needed = targeted_cost if targeting else paid_cost
            if user.coin_balance < coins_needed:
                raise ValidationError({"coins": "Insufficient balance to post this question."})
            coins_spent = coins_needed
            price_spent = coin_price * Decimal(coins_needed)
            used_free = False

        with transaction.atomic():
            serializer.save(
                quota_date=today,
                used_free_allowance=used_free,
                coins_spent=coins_spent,
                price_spent=price_spent,
                eligible_responder_count=eligible_count,
            )

            if coins_spent:
                user.coin_balance -= coins_spent
                user.save(update_fields=["coin_balance"])

    def get_serializer_context(self):
        # Ensure serializer has request for author attachment in create()
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def _validate_audience(self, targeting):
        if not targeting:
            return 0
        if not isinstance(targeting, dict):
            raise ValidationError({"targeting_criteria": "Targeting criteria must be an object."})

        allowed_fields = {
            "age_group",
            "gender_identity",
            "location_country",
            "location_state",
            "location_city",
            "languages",
            "pronouns",
        }

        filters = {}
        for key, value in targeting.items():
            if key not in allowed_fields:
                raise ValidationError({"targeting_criteria": f"Unsupported targeting field: {key}"})
            if isinstance(value, (list, tuple, set)):
                cleaned = [str(item).strip() for item in value if str(item).strip()]
                if cleaned:
                    filters[f"{key}__in"] = cleaned
            else:
                value_str = str(value).strip()
                if value_str:
                    filters[key] = value_str

        if not filters:
            return 0

        audience_qs = Profile.objects.filter(**filters).exclude(user=self.request.user)
        count = audience_qs.count()
        if count == 0:
            raise ValidationError({"targeting_criteria": "No profiles match the provided audience filters."})
        return count


class AnswerCreateView(generics.CreateAPIView):
    """Create a new answer to a question."""

    serializer_class = AnswerSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class QuestionSpendingReportView(views.APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Question.objects.filter(author=request.user)
        totals = qs.aggregate(
            total_coins=Coalesce(Sum("coins_spent"), 0),
            total_price=Coalesce(Sum("price_spent"), Decimal("0")),
            eligible_total=Coalesce(Sum("eligible_responder_count"), 0),
        )
        targeted_count = qs.exclude(targeting_criteria={}).exclude(targeting_criteria=None).count()

        today = timezone.localdate()
        free_limit = getattr(settings, "QUESTIONS_DAILY_FREE_LIMIT", 3)
        free_used = qs.filter(quota_date=today, used_free_allowance=True).count()
        free_remaining = max(free_limit - free_used, 0)

        data = {
            "total_coins_spent": totals["total_coins"],
            "total_price_spent": totals["total_price"],
            "targeted_questions": targeted_count,
            "eligible_responder_total": totals["eligible_total"],
            "free_questions_remaining": free_remaining,
        }
        return Response(data)


class QuestionTargetingReportView(generics.ListAPIView):
    serializer_class = QuestionReportSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Question.objects.filter(author=self.request.user)
            .filter(~Q(targeting_criteria={}) & ~Q(targeting_criteria=None))
            .order_by("-created_at")
        )
