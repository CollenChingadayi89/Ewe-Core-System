from django.contrib import admin
from .models import (
    ApprovalGroup,
    ApprovalGroupMembership,
    ApprovalWorkflow,
    ApprovalRequest,
    ApprovalStep,
    Notification
)


class ApprovalGroupMembershipInline(admin.TabularInline):
    """Inline admin for group memberships"""
    model = ApprovalGroupMembership
    extra = 1
    fields = ['employee', 'role', 'is_active', 'joined_at']
    readonly_fields = ['joined_at']


@admin.register(ApprovalGroup)
class ApprovalGroupAdmin(admin.ModelAdmin):
    """Admin interface for Approval Group model"""
    list_display = ['code', 'name', 'category', 'group_type', 'department', 'is_active', 'get_member_count']
    list_filter = ['category', 'group_type', 'is_active', 'department']
    search_fields = ['code', 'name', 'description']
    ordering = ['category', 'code']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']
    inlines = [ApprovalGroupMembershipInline]

    fieldsets = (
        ('Group Information', {
            'fields': ('code', 'name', 'description', 'group_type', 'category')
        }),
        ('Department Link', {
            'fields': ('department',),
            'description': 'Link to department for department-based groups'
        }),
        ('Settings', {
            'fields': ('is_active',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )

    def get_member_count(self, obj):
        """Display member count in admin list"""
        return obj.member_count
    get_member_count.short_description = 'Members'


@admin.register(ApprovalGroupMembership)
class ApprovalGroupMembershipAdmin(admin.ModelAdmin):
    """Admin interface for Approval Group Membership model"""
    list_display = ['approval_group', 'employee', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active', 'approval_group']
    search_fields = ['employee__first_name', 'employee__last_name', 'approval_group__name']
    ordering = ['-joined_at']
    readonly_fields = ['joined_at']


class ApprovalStepInline(admin.TabularInline):
    """Inline admin for approval steps"""
    model = ApprovalStep
    extra = 0
    fields = ['stage_number', 'stage_name', 'approver', 'status', 'decision_date', 'comments']
    readonly_fields = ['decision_date', 'created_at']


@admin.register(ApprovalWorkflow)
class ApprovalWorkflowAdmin(admin.ModelAdmin):
    """Admin interface for Approval Workflow model"""
    list_display = [
        'workflow_name', 'workflow_type', 'is_active',
        'require_sequential', 'escalation_enabled'
    ]
    list_filter = ['workflow_type', 'is_active', 'require_sequential', 'escalation_enabled']
    search_fields = ['workflow_name', 'description']
    ordering = ['workflow_name']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Workflow Information', {
            'fields': ('workflow_name', 'description', 'workflow_type')
        }),
        ('Approval Stages', {
            'fields': ('stages',),
            'description': 'Define the sequence of approval stages and approvers'
        }),
        ('Workflow Conditions', {
            'fields': ('conditions',),
            'description': 'Conditions that determine when this workflow applies'
        }),
        ('Settings', {
            'fields': ('is_active', 'allow_parallel_approval', 'require_sequential')
        }),
        ('Escalation', {
            'fields': ('escalation_enabled', 'escalation_hours', 'escalation_action'),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    """Admin interface for Approval Request model"""
    list_display = [
        'request_number', 'requester', 'status', 'priority',
        'current_stage', 'current_approver', 'submitted_date'
    ]
    list_filter = ['status', 'priority', 'workflow__workflow_type', 'submitted_date']
    search_fields = ['request_number', 'request_summary', 'requester__first_name', 'requester__last_name']
    ordering = ['-submitted_date', '-created_at']
    readonly_fields = [
        'submitted_date', 'final_approval_date', 'rejection_date',
        'created_at', 'updated_at', 'created_by', 'modified_by'
    ]
    inlines = [ApprovalStepInline]
    date_hierarchy = 'submitted_date'

    fieldsets = (
        ('Request Identification', {
            'fields': ('request_number', 'workflow')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id'),
            'description': 'The object being approved (Leave, Expense, Payable, etc.)'
        }),
        ('Requester', {
            'fields': ('requester',)
        }),
        ('Current Status', {
            'fields': ('status', 'priority', 'current_stage', 'current_approver')
        }),
        ('Request Details', {
            'fields': ('request_summary', 'amount')
        }),
        ('Dates', {
            'fields': ('submitted_date', 'due_date', 'final_approval_date', 'rejection_date')
        }),
        ('Rejection Information', {
            'fields': ('rejected_by', 'rejection_reason'),
            'classes': ('collapse',)
        }),
        ('Additional Data', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ApprovalStep)
class ApprovalStepAdmin(admin.ModelAdmin):
    """Admin interface for Approval Step model"""
    list_display = [
        'approval_request', 'stage_number', 'stage_name',
        'approver', 'status', 'decision_date'
    ]
    list_filter = ['status', 'stage_number', 'is_escalated', 'decision_date']
    search_fields = [
        'approval_request__request_number', 'stage_name',
        'approver__first_name', 'approver__last_name', 'comments'
    ]
    ordering = ['approval_request', 'stage_number']
    readonly_fields = ['decision_date', 'escalated_at', 'created_at', 'updated_at']

    fieldsets = (
        ('Approval Request', {
            'fields': ('approval_request',)
        }),
        ('Stage Information', {
            'fields': ('stage_number', 'stage_name')
        }),
        ('Approver', {
            'fields': ('approver',)
        }),
        ('Decision', {
            'fields': ('status', 'decision_date', 'comments')
        }),
        ('Escalation', {
            'fields': ('is_escalated', 'escalated_at', 'escalated_to'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification model"""
    list_display = [
        'recipient', 'notification_type', 'title',
        'is_read', 'priority', 'created_at'
    ]
    list_filter = ['notification_type', 'is_read', 'priority', 'created_at']
    search_fields = ['title', 'message', 'recipient__first_name', 'recipient__last_name']
    ordering = ['-created_at']
    readonly_fields = ['read_at', 'created_at', 'updated_at', 'created_by', 'modified_by']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Recipient', {
            'fields': ('recipient',)
        }),
        ('Notification Content', {
            'fields': ('notification_type', 'title', 'message', 'priority')
        }),
        ('Related Approval', {
            'fields': ('approval_request',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Action', {
            'fields': ('action_url',),
            'classes': ('collapse',)
        }),
        ('Additional Data', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )
