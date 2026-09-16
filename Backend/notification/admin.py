from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification model"""
    list_display = [
        'title', 'recipient', 'notification_type',
        'priority', 'is_read', 'is_archived', 'created_at'
    ]
    list_filter = [
        'notification_type', 'priority', 'is_read',
        'is_archived', 'created_at'
    ]
    search_fields = [
        'title', 'message', 'recipient__email',
        'recipient__first_name', 'recipient__last_name'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'read_at', 'archived_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Recipient', {
            'fields': ('recipient',)
        }),
        ('Notification Content', {
            'fields': ('title', 'message', 'notification_type', 'priority')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id'),
            'description': 'Link to related object (Leave, Expense, etc.)'
        }),
        ('Action', {
            'fields': ('action_url', 'action_label')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'is_archived', 'archived_at')
        }),
        ('Source', {
            'fields': ('sender',)
        }),
        ('Additional Data', {
            'fields': ('metadata', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    actions = ['mark_as_read', 'mark_as_unread', 'archive_notifications']

    def mark_as_read(self, request, queryset):
        """Bulk mark notifications as read"""
        from django.utils import timezone
        updated = queryset.filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        self.message_user(request, f'{updated} notification(s) marked as read.')
    mark_as_read.short_description = 'Mark selected notifications as read'

    def mark_as_unread(self, request, queryset):
        """Bulk mark notifications as unread"""
        updated = queryset.filter(is_read=True).update(
            is_read=False,
            read_at=None
        )
        self.message_user(request, f'{updated} notification(s) marked as unread.')
    mark_as_unread.short_description = 'Mark selected notifications as unread'

    def archive_notifications(self, request, queryset):
        """Bulk archive notifications"""
        from django.utils import timezone
        updated = queryset.filter(is_archived=False).update(
            is_archived=True,
            archived_at=timezone.now()
        )
        self.message_user(request, f'{updated} notification(s) archived.')
    archive_notifications.short_description = 'Archive selected notifications'
