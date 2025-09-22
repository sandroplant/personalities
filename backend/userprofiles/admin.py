from django.contrib import admin

from .models import Friendship, Profile, SpotifyProfile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "age_group", "profession")
    search_fields = ("user__username", "full_name", "profession")


@admin.register(SpotifyProfile)
class SpotifyProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "display_name", "email")
    search_fields = ("display_name", "email")


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ("from_user", "to_user", "is_confirmed", "created_at")
    search_fields = ("from_user__username", "to_user__username")
    list_filter = ("is_confirmed",)
