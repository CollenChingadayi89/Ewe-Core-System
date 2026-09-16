from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Notification(models.Model):
    """
    System notifications for users.
    Uses GenericForeignKey to link notifications to any model object.
    """
    # Recipient Information
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Recipient'
    )

    # Notification Content
    title = models.CharField(max_length=200, verbose_name='Notification Title')
    message = models.TextField(verbose_name='Notification Message')
    notification_type = models.CharField(
        max_length=50,
        choices=[
            ('info', 'Information'),
            ('success', 'Success'),
            ('warning', 'Warning'),
            ('error', 'Error'),
            ('approval_request', 'Approval Request'),
            ('approval_approved', 'Approval Approved'),
            ('approval_rejected', 'Approval Rejected'),
            ('leave_approved', 'Leave Approved'),
            ('leave_rejected', 'Leave Rejected'),
            ('expense_approved', 'Expense Approved'),
            ('payable_due', 'Payable Due'),
            ('receivable_overdue', 'Receivable Overdue'),
            ('document_uploaded', 'Document Uploaded'),
            ('system', 'System Notification')
        ],
        default='info',
        verbose_name='Notification Type'
    )

    # Polymorphic Relationship (link to any related object)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        verbose_name='Related Model Type',
        help_text='Type of object this notification is about (e.g., Leave, Expense, Payable)'
    )
    object_id = models.UUIDField(
        blank=True,
        null=True,
        verbose_name='Related Object ID',
        help_text='ID of the object this notification is about'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Action/URL
    action_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Action URL',
        help_text='Frontend URL to navigate to when notification is clicked'
    )
    action_label = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Action Label',
        help_text='Label for action button (e.g., "View Details", "Approve")'
    )

    # Status
    is_read = models.BooleanField(default=False, verbose_name='Is Read')
    read_at = models.DateTimeField(blank=True, null=True, verbose_name='Read At')
    is_archived = models.BooleanField(default=False, verbose_name='Is Archived')
    archived_at = models.DateTimeField(blank=True, null=True, verbose_name='Archived At')

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

    # Sender/Source
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='sent_notifications',
        verbose_name='Sender',
        help_text='User who triggered this notification (if applicable)'
    )

    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata',
        help_text='Additional data for the notification'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    expires_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Expires At',
        help_text='Date when notification should be auto-archived'
    )

    class Meta:
        db_table = 'notification'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['is_read', 'is_archived']),
        ]

    def __str__(self):
        return f"{self.title} - {self.recipient.email}"

    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()

    def mark_as_unread(self):
        """Mark notification as unread"""
        self.is_read = False
        self.read_at = None
        self.save()

    def archive(self):
        """Archive notification"""
        from django.utils import timezone
        if not self.is_archived:
            self.is_archived = True
            self.archived_at = timezone.now()
            self.save()

    def unarchive(self):
        """Unarchive notification"""
        self.is_archived = False
        self.archived_at = None
        self.save()

    @classmethod
    def create_notification(cls, recipient, title, message, notification_type='info',
                           content_object=None, action_url=None, action_label=None,
                           priority='medium', sender=None, metadata=None):
        """
        Helper method to create a notification.

        Usage:
            Notification.create_notification(
                recipient=user,
                title='Leave Request Approved',
                message='Your leave request has been approved.',
                notification_type='leave_approved',
                content_object=leave_request,
                action_url='/hr/leave/123',
                action_label='View Details',
                priority='high',
                sender=approver
            )
        """
        notification = cls(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url,
            action_label=action_label,
            priority=priority,
            sender=sender,
            metadata=metadata or {}
        )

        if content_object:
            notification.content_object = content_object

        notification.save()
        return notification
