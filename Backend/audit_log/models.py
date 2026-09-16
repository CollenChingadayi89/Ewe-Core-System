from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import uuid


class AuditLog(models.Model):
    """
    Comprehensive audit logging model for forensic tracking.
    Tracks all CRUD operations across critical models for compliance and security.

    Features:
    - Immutable records (cannot be deleted or modified)
    - Tracks who did what, when, and from where
    - Stores before/after snapshots for data changes
    - Generic foreign key for any model
    - IP address and user agent tracking
    """

    # Action Types
    CREATE = 'create'
    READ = 'read'
    UPDATE = 'update'
    DELETE = 'delete'
    LOGIN = 'login'
    LOGOUT = 'logout'
    LOGIN_FAILED = 'login_failed'
    PASSWORD_CHANGE = 'password_change'
    PERMISSION_CHANGE = 'permission_change'
    EXPORT = 'export'
    APPROVE = 'approve'
    REJECT = 'reject'

    ACTION_CHOICES = [
        (CREATE, 'Create'),
        (READ, 'Read'),
        (UPDATE, 'Update'),
        (DELETE, 'Delete'),
        (LOGIN, 'Login'),
        (LOGOUT, 'Logout'),
        (LOGIN_FAILED, 'Login Failed'),
        (PASSWORD_CHANGE, 'Password Change'),
        (PERMISSION_CHANGE, 'Permission Change'),
        (EXPORT, 'Export'),
        (APPROVE, 'Approve'),
        (REJECT, 'Reject'),
    ]

    # Primary identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Who performed the action
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='User',
        help_text='User who performed the action (null if system action)'
    )
    user_email = models.EmailField(
        max_length=255,
        verbose_name='User Email',
        help_text='Email address of user at time of action (preserved even if user deleted)'
    )

    # What action was performed
    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
        verbose_name='Action',
        db_index=True
    )

    # What model/object was affected (Generic Foreign Key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Content Type',
        help_text='Type of object affected'
    )
    object_id = models.CharField(
        max_length=255,
        verbose_name='Object ID',
        help_text='ID of the affected object'
    )
    content_object = GenericForeignKey('content_type', 'object_id')
    object_repr = models.CharField(
        max_length=500,
        verbose_name='Object Representation',
        help_text='String representation of the object at time of action'
    )

    # When did it happen
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Timestamp')

    # Where did it happen (tracking)
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP Address',
        help_text='IP address from which action was performed'
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name='User Agent',
        help_text='Browser/client user agent string'
    )

    # Data snapshots (for UPDATE actions)
    changes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Changes',
        help_text='Dictionary of field changes: {field: {"old": value, "new": value}}'
    )

    # Additional context
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description',
        help_text='Human-readable description of the action'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata',
        help_text='Additional contextual data (request params, error details, etc.)'
    )

    # Risk flagging
    is_suspicious = models.BooleanField(
        default=False,
        verbose_name='Is Suspicious',
        help_text='Flag for potentially suspicious activity'
    )
    risk_level = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical')
        ],
        default='low',
        verbose_name='Risk Level'
    )

    class Meta:
        db_table = 'audit_log'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['is_suspicious', 'risk_level']),
            models.Index(fields=['-timestamp']),  # Most recent first
        ]
        # Prevent modification or deletion of audit logs
        permissions = [
            ('view_audit_log', 'Can view audit logs'),
            ('export_audit_log', 'Can export audit logs'),
        ]

    def __str__(self):
        return f"{self.user_email} - {self.action} - {self.object_repr} - {self.timestamp}"

    def save(self, *args, **kwargs):
        """
        Override save to make logs immutable after creation.
        Once saved, audit logs cannot be modified.
        """
        if self.pk:
            # If this is an UPDATE (record already exists), prevent it
            raise ValueError("Audit logs are immutable and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Override delete to prevent deletion of audit logs.
        Audit logs must be retained for compliance.
        """
        raise ValueError("Audit logs cannot be deleted. They must be retained for compliance.")

    @classmethod
    def log_action(cls, user, action, content_object, description=None, changes=None, ip_address=None, user_agent=None, metadata=None):
        """
        Convenience method to create audit log entries.

        Usage:
            AuditLog.log_action(
                user=request.user,
                action=AuditLog.UPDATE,
                content_object=employee,
                description="Updated employee salary",
                changes={"basic_salary": {"old": 1000, "new": 1500}},
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        """
        return cls.objects.create(
            user=user,
            user_email=user.email if user else 'system@ewesacco.org',
            action=action,
            content_type=ContentType.objects.get_for_model(content_object),
            object_id=str(content_object.pk),
            object_repr=str(content_object)[:500],
            description=description or f"{action.capitalize()} {content_object._meta.verbose_name}",
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata or {}
        )
