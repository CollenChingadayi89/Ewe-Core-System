from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model"""
    list_display = ['email', 'is_active', 'is_2fa_enabled', 'email_verified', 'is_staff', 'is_superuser', 'date_joined']
    list_filter = ['is_active', 'is_2fa_enabled', 'email_verified', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['email']
    ordering = ['-date_joined']

    # Mark non-editable fields as readonly
    readonly_fields = [
        'last_login',
        'date_joined',
        'last_2fa_verification',
        'email_verification_sent_at',
        'last_failed_login',
        'account_locked_until',
        'last_password_change'
    ]

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Two-Factor Authentication', {
            'fields': ('is_2fa_enabled', 'totp_secret', 'backup_codes', 'last_2fa_verification'),
            'classes': ('collapse',),
        }),
        ('Email Verification', {
            'fields': ('email_verified', 'email_verification_token', 'email_verification_sent_at'),
            'classes': ('collapse',),
        }),
        ('Security & Rate Limiting', {
            'fields': ('failed_login_attempts', 'last_failed_login', 'account_locked_until', 'last_password_change'),
            'classes': ('collapse',),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
