"""
URL configuration for the questions app.

Exposes endpoints for listing tags, listing/creating questions, and
submitting answers.  All endpoints require authentication via token.
"""

from django.urls import path

from .views import (
    AnswerCreateView,
    QuestionListCreateView,
    QuestionSpendingReportView,
    QuestionTargetingReportView,
    TagListView,
)

urlpatterns = [
    path("tags/", TagListView.as_view(), name="tag-list"),
    path("questions/", QuestionListCreateView.as_view(), name="question-list-create"),
    path("answers/", AnswerCreateView.as_view(), name="answer-create"),
    path("questions/reports/spending/", QuestionSpendingReportView.as_view(), name="question-spending-report"),
    path(
        "questions/reports/targeting/",
        QuestionTargetingReportView.as_view(),
        name="question-targeting-report",
    ),
]
