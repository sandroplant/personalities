"""
URL configuration for the questions app.

Exposes endpoints for listing tags, listing/creating questions, and
submitting answers.  All endpoints require authentication via token.
"""

from django.urls import path

from .views import (
    AnswerCreateView,
    AnswerReactionView,
    QuestionListCreateView,
    QuestionReactionView,
    TagListView,
)

urlpatterns = [
    path("tags/", TagListView.as_view(), name="tag-list"),
    path("questions/", QuestionListCreateView.as_view(), name="question-list-create"),
    path("answers/", AnswerCreateView.as_view(), name="answer-create"),
    path("questions/<int:pk>/reactions/", QuestionReactionView.as_view(), name="question-reactions"),
    path("answers/<int:pk>/reactions/", AnswerReactionView.as_view(), name="answer-reactions"),
]
