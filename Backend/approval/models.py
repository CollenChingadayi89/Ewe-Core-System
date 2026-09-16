from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.models import BaseModel


class ApprovalWorkflow(BaseModel):
    """
    Defines reusable approval workflow templates.
    Specifies the sequence of approvers and rules for different types of requests.
    """
    # Workflow Identification
    workflow_name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Workflow Name',
        help_text='e.g., "Leave Approval", "Expense Approval", "Procurement Approval"'
    )
    description = models.TextField(blank=True, null=True, verbose_name='Description')

    # Workflow Type
    workflow_type = models.CharField(
        max_length=50,
        choices=[
            ('leave', 'Leave Request'),
            ('expense', 'Expense Request'),
            ('petty_cash', 'Petty Cash Request'),
            ('payable', 'Payable/Payment Request'),
            ('receivable', 'Receivable'),
            ('procurement', 'Procurement Request'),
            ('document', 'Document Approval'),
            ('other', 'Other')
        ],
        verbose_name='Workflow Type'
    )

    # Approval Stages
    stages = models.JSONField(
        default=list,
        verbose_name='Approval Stages',
        help_text='''Array of approval stages in order:
        [
            {
                "stage_number": 1,
                "stage_name": "Supervisor Approval",
                "approver_type": "position",
                "approver_position": "supervisor",
                "approver_employee_ids": [],
                "approval_logic": "any",
                "is_required": true,
                "auto_approve_conditions": null
            },
            {
                "stage_number": 2,
                "stage_name": "Finance Manager Approval",
                "approver_type": "specific",
                "approver_position": null,
                "approver_employee_ids": ["uuid1", "uuid2"],
                "approval_logic": "all",
                "is_required": true,
                "auto_approve_conditions": {"amount_less_than": 1000}
            }
        ]
        approver_type: position | specific | department_head | role
        approval_logic: any (one approver) | all (all must approve)
        '''
    )

    # Conditions
    conditions = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Workflow Conditions',
        help_text='''Conditions that determine when this workflow applies:
        {
            "min_amount": 0,
            "max_amount": null,
            "departments": ["hr", "finance"],
            "priority": ["high", "urgent"]
        }
        '''
    )

    # Settings
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    allow_parallel_approval = models.BooleanField(
        default=False,
        verbose_name='Allow Parallel Approval',
        help_text='If true, all stages can be approved simultaneously'
    )
    require_sequential = models.BooleanField(
        default=True,
        verbose_name='Require Sequential Approval',
        help_text='If true, stages must be approved in order'
    )

    # Escalation
    escalation_enabled = models.BooleanField(
        default=False,
        verbose_name='Enable Escalation',
        help_text='Auto-escalate if not approved within timeframe'
    )
    escalation_hours = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Escalation Hours',
        help_text='Hours before escalation (e.g., 24, 48)'
    )
    escalation_action = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Escalation Action',
        help_text='What happens on escalation (notify, auto-approve, etc.)'
    )

    class Meta:
        db_table = 'approval_workflow'
        verbose_name = 'Approval Workflow'
        verbose_name_plural = 'Approval Workflows'
        ordering = ['workflow_name']

    def __str__(self):
        return f"{self.workflow_name} ({self.workflow_type})"


class ApprovalRequest(BaseModel):
    """
    Represents a specific approval request for any object.
    Uses GenericForeignKey to link to Leave, Expense, Payable, etc.
    """
    # Request Identification
    request_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Request Number',
        help_text='Unique identifier (e.g., APR-2026-000001)'
    )

    # Workflow
    workflow = models.ForeignKey(
        ApprovalWorkflow,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='approval_requests',
        verbose_name='Approval Workflow'
    )

    # Polymorphic Relationship (the object being approved)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Object Type',
        help_text='Type of object being approved (Leave, Expense, Payable, etc.)'
    )
    object_id = models.UUIDField(
        verbose_name='Object ID',
        help_text='ID of the object being approved'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Requester
    requester = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='approval_requests',
        verbose_name='Requester'
    )

    # Current Stage
    current_stage = models.IntegerField(
        default=1,
        verbose_name='Current Stage',
        help_text='Current approval stage number'
    )
    current_approver = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='pending_approvals',
        verbose_name='Current Approver'
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('cancelled', 'Cancelled'),
            ('escalated', 'Escalated')
        ],
        default='pending',
        verbose_name='Status'
    )
    priority = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent')
        ],
        default='medium',
        verbose_name='Priority'
    )

    # Dates
    submitted_date = models.DateTimeField(auto_now_add=True, verbose_name='Submitted Date')
    due_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Due Date',
        help_text='Date by which approval is needed'
    )
    final_approval_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Final Approval Date'
    )
    rejection_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Rejection Date'
    )

    # Summary
    request_summary = models.TextField(
        verbose_name='Request Summary',
        help_text='Brief description of what is being approved'
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Amount (ZWG)',
        help_text='Monetary amount if applicable'
    )

    # Rejection
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='Rejection Reason'
    )
    rejected_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='rejected_requests',
        verbose_name='Rejected By'
    )

    # Additional Data
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata',
        help_text='Additional request data'
    )

    class Meta:
        db_table = 'approval_request'
        verbose_name = 'Approval Request'
        verbose_name_plural = 'Approval Requests'
        ordering = ['-submitted_date', '-created_at']
        indexes = [
            models.Index(fields=['request_number']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['status', 'current_approver']),
            models.Index(fields=['requester', 'status']),
            models.Index(fields=['due_date', 'status']),
        ]

    def __str__(self):
        return f"{self.request_number} - {self.request_summary[:50]}"

    def is_overdue(self):
        """Check if approval request is overdue"""
        from django.utils import timezone
        if self.status in ['pending', 'in_progress'] and self.due_date:
            return self.due_date < timezone.now().date()
        return False


class ApprovalStep(models.Model):
    """
    Individual approval step within an approval request.
    Tracks who approved/rejected at each stage.
    """
    # Approval Request
    approval_request = models.ForeignKey(
        ApprovalRequest,
        on_delete=models.CASCADE,
        related_name='approval_steps',
        verbose_name='Approval Request'
    )

    # Stage Information
    stage_number = models.IntegerField(verbose_name='Stage Number')
    stage_name = models.CharField(max_length=100, verbose_name='Stage Name')

    # Approver
    approver = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='approval_steps',
        verbose_name='Approver'
    )

    # Decision
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('skipped', 'Skipped')
        ],
        default='pending',
        verbose_name='Status'
    )
    decision_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Decision Date'
    )
    comments = models.TextField(
        blank=True,
        null=True,
        verbose_name='Comments',
        help_text='Approver comments'
    )

    # Escalation
    is_escalated = models.BooleanField(default=False, verbose_name='Is Escalated')
    escalated_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Escalated At'
    )
    escalated_to = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='escalated_approvals',
        verbose_name='Escalated To'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'approval_step'
        verbose_name = 'Approval Step'
        verbose_name_plural = 'Approval Steps'
        ordering = ['approval_request', 'stage_number']
        unique_together = [['approval_request', 'stage_number', 'approver']]
        indexes = [
            models.Index(fields=['approval_request', 'status']),
            models.Index(fields=['approver', 'status']),
        ]

    def __str__(self):
        return f"{self.approval_request.request_number} - Stage {self.stage_number} ({self.approver.get_full_name()})"

    def approve(self, comments=''):
        """Approve this step"""
        from django.utils import timezone
        self.status = 'approved'
        self.decision_date = timezone.now()
        self.comments = comments
        self.save()

    def reject(self, comments=''):
        """Reject this step"""
        from django.utils import timezone
        self.status = 'rejected'
        self.decision_date = timezone.now()
        self.comments = comments
        self.save()
