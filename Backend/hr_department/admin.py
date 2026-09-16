from django.contrib import admin
from .models import Department, Designation


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin interface for Department model"""
    list_display = ['code', 'name', 'manager', 'parent_department', 'employee_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['code', 'name', 'description']
    ordering = ['code']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description')
        }),
        ('Organization', {
            'fields': ('manager', 'parent_department', 'employee_count')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    """Admin interface for Designation model"""
    list_display = ['code', 'title', 'department', 'level', 'grade', 'salary_range_min', 'salary_range_max', 'is_active']
    list_filter = ['department', 'level', 'grade', 'is_active', 'created_at']
    search_fields = ['code', 'title', 'description']
    ordering = ['department', 'title']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'title', 'department')
        }),
        ('Classification', {
            'fields': ('level', 'grade')
        }),
        ('Salary Range', {
            'fields': ('salary_range_min', 'salary_range_max')
        }),
        ('Details', {
            'fields': ('description', 'requirements')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )
