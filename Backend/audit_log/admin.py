from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Read-only admin interface for Audit Logs.
    Audit logs cannot be added, modified, or deleted through the admin.
    """
    list_display = [
        'timestamp',
        'user_email',
        'action',
        'content_type',
        'object_repr',
        'ip_address',
        'risk_level',
        'is_suspicious'
    ]
    list_filter = [
        'action',
        'content_type',
        'risk_level',
        'is_suspicious',
        'timestamp'
    ]
    search_fields = [
        'user_email',
        'object_repr',
        'description',
        'ip_address'
    ]
    readonly_fields = [
        'id',
        'user',
        'user_email',
        'action',
        'content_type',
        'object_id',
        'object_repr',
        'timestamp',
        'ip_address',
        'user_agent',
        'changes',
        'description',
        'metadata',
        'is_suspicious',
        'risk_level'
    ]
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'

    fieldsets = (
        ('Who', {
            'fields': ('user', 'user_email', 'ip_address', 'user_agent')
        }),
        ('What', {
            'fields': ('action', 'content_type', 'object_id', 'object_repr', 'description')
        }),
        ('When', {
            'fields': ('timestamp',)
        }),
        ('Changes', {
            'fields': ('changes', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Risk Assessment', {
            'fields': ('is_suspicious', 'risk_level'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """Disable adding audit logs manually"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disable deleting audit logs"""
        return False

    def has_change_permission(self, request, obj=None):
        """Disable changing audit logs (view-only)"""
        return False

    def get_actions(self, request):
        """Remove all bulk actions"""
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
