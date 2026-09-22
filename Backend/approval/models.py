from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.models import BaseModel


class ApprovalGroup(BaseModel):
    """
    Approval group for workflow assignment.
    Groups can be department-based, role-based, or custom teams.
    CONSTRAINT: Each employee can belong to only ONE active group at a time.
    Cross-group approval is configured via workflows (not membership).
    """
    # Group Identification
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Group Code',
        help_text='Unique code (e.g., GRP-EXEC, GRP-HR-MGMT)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Group Name',
        help_text='Display name (e.g., "Executive Group", "HR Management Team")'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description',
        help_text='Purpose and membership criteria of this group'
    )

    # Group Type
    group_type = models.CharField(
        max_length=20,
        choices=[
            ('department', 'Department-Based'),
            ('role', 'Role-Based'),
            ('custom', 'Custom Team'),
            ('project', 'Project Team')
        ],
        default='custom',
        verbose_name='Group Type',
        help_text='Type of approval group'
    )

    # Category (Business Area)
    category = models.CharField(
        max_length=50,
        choices=[
            ('finance', 'Finance'),
            ('leave', 'Leave/HR'),
            ('procurement', 'Procurement'),
            ('hr', 'Human Resources'),
            ('general', 'General'),
        ],
        default='general',
        verbose_name='Category',
        help_text='Business area this group handles (Finance, Leave, Procurement, etc.)'
    )

    # Department Link (for department-based groups)
    department = models.ForeignKey(
        'hr_department.Department',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='approval_groups',
        verbose_name='Department',
        help_text='Link to department for department-based groups'
    )

    # Members (Many-to-Many through ApprovalGroupMembership)
    members = models.ManyToManyField(
        'hr_employee.Employee',
        through='ApprovalGroupMembership',
        related_name='approval_groups',
        verbose_name='Members'
    )

    # Settings
    is_active = models.BooleanField(
        default=True,
        verbose_name='Is Active',
        help_text='Inactive groups are not used for workflow assignment'
    )

    class Meta:
        db_table = 'approval_group'
        verbose_name = 'Approval Group'
        verbose_name_plural = 'Approval Groups'
        ordering = ['code', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def member_count(self):
        """Count of active members in this group"""
        return self.members.filter(is_active=True).count()


class ApprovalGroupMembership(models.Model):
    """
    Many-to-many through table for ApprovalGroup <> Employee.
    Tracks membership roles and dates.

    CONSTRAINT: One employee can only be in ONE active group at a time.
    When adding an employee to a new group, their previous active
    memberships are automatically deactivated.
    """
    # Relationships
    approval_group = models.ForeignKey(
        ApprovalGroup,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name='Approval Group'
    )
    employee = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.CASCADE,
        related_name='group_memberships',
        verbose_name='Employee'
    )

    # Membership Role
    role = models.CharField(
        max_length=20,
        choices=[
            ('member', 'Member'),
            ('lead', 'Group Lead'),
            ('admin', 'Group Admin')
        ],
        default='member',
        verbose_name='Role',
        help_text='Role within the approval group'
    )

    # Timestamps
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Joined At'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Is Active',
        help_text='Inactive memberships are excluded from approvals'
    )

    class Meta:
        db_table = 'approval_group_membership'
        verbose_name = 'Approval Group Membership'
        verbose_name_plural = 'Approval Group Memberships'
        unique_together = [['approval_group', 'employee']]
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.employee.get_full_name()} in {self.approval_group.name} ({self.role})"

    def save(self, *args, **kwargs):
        """
        Override save to enforce one-employee-one-group constraint.
        When activating a membership, deactivate all other active
        memberships for this employee.
        """
        if self.is_active:
            # Deactivate all other active memberships for this employee
            ApprovalGroupMembership.objects.filter(
                employee=self.employee,
                is_active=True
            ).exclude(pk=self.pk).update(is_active=False)

        super().save(*args, **kwargs)

    @classmethod
    def get_employee_current_group(cls, employee):
        """
        Get the current active group for an employee.
        Returns ApprovalGroupMembership object or None.
        """
        return cls.objects.filter(
            employee=employee,
            is_active=True
        ).select_related('approval_group').first()


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
                "stage_name": "Group Approval",
                "approver_type": "group",
                "approver_group_id": "uuid-of-approval-group",
                "approval_logic": "any",
                "is_required": true,
                "auto_approve_conditions": null
            }
        ]
        approver_type: position | specific | department_head | role | group
        approval_logic: any (one approver) | all (all must approve)
        '''
    )

    # Applicable Groups (NEW)
    applicable_groups = models.ManyToManyField(
        ApprovalGroup,
        blank=True,
        related_name='workflows',
        verbose_name='Applicable to Groups',
        help_text='This workflow will be used for employees in these groups (highest priority)'
    )

    # Conditions
    conditions = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Workflow Conditions',
        help_text='''Conditions that determine when this workflow applies:
        {
            "approval_groups": ["GRP-EXEC", "GRP-HR"],  # Group codes
            "departments": ["HR", "FIN"],               # Department codes
            "employee_roles": ["ceo", "hr_manager"],    # System roles
            "priority": ["high", "urgent"],
            "min_amount": 0,
            "max_amount": 10000
        }
        Priority: 1) applicable_groups (M2M), 2) conditions filters, 3) default (no conditions)
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
    action_type = models.CharField(
        max_length=20,
        choices=[
            ('certify', 'Certify'),
            ('recommend', 'Recommend'),
            ('approve', 'Approve'),
            ('review', 'Review'),
        ],
        default='approve',
        verbose_name='Action Type',
        help_text='Type of action required at this stage'
    )

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

    def save(self, *args, **kwargs):
        """Override save to trigger auto-advance and notifications"""
        is_new = self.pk is None
        old_status = None

        if not is_new:
            try:
                old_instance = ApprovalStep.objects.get(pk=self.pk)
                old_status = old_instance.status
            except ApprovalStep.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        # If status changed from pending to approved/rejected
        if old_status == 'pending' and self.status in ['approved', 'rejected']:
            # Import here to avoid circular imports
            from .utils import notify_approval_action, advance_approval_stage

            # Send notifications
            notify_approval_action(self, action_type=self.status)

            # Auto-advance if approved
            if self.status == 'approved':
                advance_approval_stage(self.approval_request)

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


class Notification(BaseModel):
    """
    System notifications for approval workflow events.
    Notifies users of approval requests, decisions, escalations, etc.
    """
    # Recipient
    recipient = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Recipient'
    )

    # Notification Type
    notification_type = models.CharField(
        max_length=50,
        choices=[
            ('approval_required', 'Approval Required'),
            ('approved', 'Request Approved'),
            ('rejected', 'Request Rejected'),
            ('cancelled', 'Request Cancelled'),
            ('escalated', 'Request Escalated'),
            ('stage_advanced', 'Stage Advanced'),
            ('request_created', 'Request Created'),
            ('reminder', 'Reminder'),
        ],
        verbose_name='Notification Type'
    )

    # Content
    title = models.CharField(
        max_length=200,
        verbose_name='Title',
        help_text='Notification title/subject'
    )
    message = models.TextField(
        verbose_name='Message',
        help_text='Notification message body'
    )

    # Related Approval Request
    approval_request = models.ForeignKey(
        ApprovalRequest,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Approval Request',
        blank=True,
        null=True
    )

    # Status
    is_read = models.BooleanField(
        default=False,
        verbose_name='Is Read'
    )
    read_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Read At'
    )

    # Priority
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

    # Action URL
    action_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Action URL',
        help_text='URL to navigate to when notification is clicked'
    )

    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata',
        help_text='Additional notification data'
    )

    class Meta:
        db_table = 'approval_notification'
        verbose_name = 'Approval Notification'
        verbose_name_plural = 'Approval Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type', 'is_read']),
            models.Index(fields=['created_at']),
            models.Index(fields=['approval_request']),
        ]

    def __str__(self):
        return f"{self.notification_type} - {self.recipient.get_full_name()}"

    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
