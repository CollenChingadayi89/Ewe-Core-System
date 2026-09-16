from django.contrib import admin
from .models import DocumentCategory, Document


@admin.register(DocumentCategory)
class DocumentCategoryAdmin(admin.ModelAdmin):
    """Admin interface for Document Category model"""
    list_display = ['name', 'parent_category', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent_category']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'description', 'parent_category')
        }),
        ('Display Settings', {
            'fields': ('icon', 'color')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Admin interface for Document model"""
    list_display = [
        'document_number', 'title', 'category', 'version',
        'is_latest_version', 'status', 'uploaded_by', 'upload_date'
    ]
    list_filter = [
        'status', 'access_level', 'is_latest_version',
        'category', 'upload_date', 'expiry_date'
    ]
    search_fields = [
        'document_number', 'title', 'description',
        'file_name', 'tags'
    ]
    ordering = ['-upload_date', '-version']
    readonly_fields = [
        'upload_date', 'created_at', 'updated_at',
        'created_by', 'modified_by'
    ]
    filter_horizontal = ['allowed_users']

    fieldsets = (
        ('Document Identification', {
            'fields': ('document_number', 'title', 'description', 'category')
        }),
        ('File Information', {
            'fields': (
                'file_url', 'file_name', 'file_size',
                'file_type', 'file_extension'
            )
        }),
        ('Version Control', {
            'fields': ('version', 'is_latest_version', 'previous_version')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id'),
            'description': 'Link this document to any object (Employee, Member, Leave, etc.)'
        }),
        ('Upload Information', {
            'fields': ('uploaded_by', 'upload_date')
        }),
        ('Access Control', {
            'fields': ('access_level', 'allowed_roles', 'allowed_users')
        }),
        ('Metadata', {
            'fields': ('tags', 'expiry_date')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )
