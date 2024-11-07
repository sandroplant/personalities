# core/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, Message, Post, Comment

class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    list_display = ('username', 'email', 'is_staff')
    search_fields = ('email', 'username')
    ordering = ('username',)

admin.site.register(User, UserAdmin)
admin.site.register(Profile)
admin.site.register(Message)
admin.site.register(Post)
admin.site.register(Comment)
