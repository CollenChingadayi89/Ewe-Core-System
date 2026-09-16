import uuid
from django.db import models
from django.conf import settings


class TimestampedModel(models.Model):
    """
    Abstract base model providing automatic timestamp fields.
    Tracks when records are created and last updated.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')

    class Meta:
        abstract = True


class AuditedModel(models.Model):
    """
    Abstract base model providing audit trail fields.
    Tracks who created and last modified records.
    """
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created',
        verbose_name='Created By'
    )
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_modified',
        verbose_name='Modified By'
    )

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """
    Abstract base model providing soft delete functionality.
    Records are marked as deleted instead of being removed from database.
    """
    is_deleted = models.BooleanField(default=False, verbose_name='Is Deleted')
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='Deleted At')
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_deleted',
        verbose_name='Deleted By'
    )

    class Meta:
        abstract = True


class BaseModel(TimestampedModel, AuditedModel, SoftDeleteModel):
    """
    Complete base model combining timestamps, audit trail, and soft delete.
    All business models should inherit from this for consistent behavior.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True
