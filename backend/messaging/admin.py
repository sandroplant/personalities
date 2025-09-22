from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "recipient", "created_at", "is_mystery_message")
    list_filter = ("is_mystery_message", "created_at")
    search_fields = ("sender__username", "recipient__username", "content")
