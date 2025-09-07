from django.urls import path
from . import views

urlpatterns = [
    path("generate/", views.generate_ai_response, name="generate_ai_response"),
]
