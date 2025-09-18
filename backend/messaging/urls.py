from django.urls import path

from .views import MessagingView

urlpatterns = [
    path(
        "send/", MessagingView.as_view(), name="send_message"
    ),  # Handle POST in the class
    path(
        "conversation/<str:userId1>/<str:userId2>/",
        MessagingView.as_view(),
        name="get_conversation",
    ),  # Handle GET in the class
    path(
        "send-mystery/", MessagingView.as_view(), name="send_mystery_message"
    ),  # Handle POST in the class
    path(
        "start-call/", MessagingView.as_view(), name="start_call"
    ),  # Handle POST in the class
]
