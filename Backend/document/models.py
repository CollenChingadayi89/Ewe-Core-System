from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.models import BaseModel


class DocumentCategory(BaseModel):
    """
    Document categories for organizing documents.
    Examples: Policies, Contracts, Reports, HR Documents, Finance Documents
    """
    name = models.CharField(max_length=100, unique=True, verbose_name='Category Name')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icon',
        help_text='Icon name for UI display'
    )
    color = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Color',
        help_text='Color code for UI display (e.g., #FF5733)'
    )
    parent_category = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='subcategories',
        verbose_name='Parent Category',
        help_text='For hierarchical category structure'
    )
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        db_table = 'document_category'
        verbose_name = 'Document Category'
        verbose_name_plural = 'Document Categories'
        ordering = ['name']

    def __str__(self):
        if self.parent_category:
            return f"{self.parent_category.name} > {self.name}"
        return self.name


class Document(BaseModel):
    """
    Document management with version control.
    Uses GenericForeignKey to link documents to any model (Employee, Member, Leave, Expense, etc.)
    """
    # Document Identification
    document_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Document Number',
        help_text='Unique identifier (e.g., DOC-2026-000001)'
    )
    title = models.CharField(max_length=200, verbose_name='Document Title')
    description = models.TextField(blank=True, null=True, verbose_name='Description')

    # Category
    category = models.ForeignKey(
        DocumentCategory,
        on_delete=models.PROTECT,
        related_name='documents',
        verbose_name='Category'
    )

    # File Information
    file_url = models.URLField(
        max_length=500,
        verbose_name='File URL',
        help_text='URL to the document file (cloud storage, S3, etc.)'
    )
    file_name = models.CharField(max_length=255, verbose_name='File Name')
    file_size = models.BigIntegerField(
        verbose_name='File Size (bytes)',
        help_text='File size in bytes'
    )
    file_type = models.CharField(
        max_length=50,
        verbose_name='File Type',
        help_text='MIME type (e.g., application/pdf, image/jpeg)'
    )
    file_extension = models.CharField(
        max_length=10,
        verbose_name='File Extension',
        help_text='e.g., pdf, docx, xlsx, jpg'
    )

    # Version Control
    version = models.IntegerField(
        default=1,
        verbose_name='Version Number',
        help_text='Document version (auto-incremented)'
    )
    is_latest_version = models.BooleanField(
        default=True,
        verbose_name='Is Latest Version'
    )
    previous_version = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='newer_versions',
        verbose_name='Previous Version',
        help_text='Link to previous version of this document'
    )

    # Polymorphic Relationship (can be attached to any model)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        verbose_name='Related Model Type',
        help_text='Type of object this document is attached to (e.g., Employee, Leave, Expense)'
    )
    object_id = models.UUIDField(
        blank=True,
        null=True,
        verbose_name='Related Object ID',
        help_text='ID of the object this document is attached to'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Ownership & Access
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='uploaded_documents',
        verbose_name='Uploaded By'
    )
    upload_date = models.DateTimeField(auto_now_add=True, verbose_name='Upload Date')

    # Access Control
    access_level = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('internal', 'Internal Only'),
            ('restricted', 'Restricted'),
            ('confidential', 'Confidential')
        ],
        default='internal',
        verbose_name='Access Level'
    )
    allowed_roles = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Allowed Roles',
        help_text='Array of role names that can access this document'
    )
    allowed_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='accessible_documents',
        verbose_name='Allowed Users',
        help_text='Specific users who can access this document'
    )

    # Document Metadata
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Tags',
        help_text='Array of tag strings for search/categorization'
    )
    expiry_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Expiry Date',
        help_text='Date when document becomes invalid (e.g., contracts, licenses)'
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('active', 'Active'),
            ('archived', 'Archived'),
            ('expired', 'Expired'),
            ('superseded', 'Superseded')
        ],
        default='active',
        verbose_name='Status'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        db_table = 'document'
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-upload_date', '-version']
        indexes = [
            models.Index(fields=['document_number']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['uploaded_by', 'upload_date']),
            models.Index(fields=['expiry_date']),
            models.Index(fields=['is_latest_version', 'status']),
        ]

    def __str__(self):
        return f"{self.document_number} - {self.title} (v{self.version})"

    def is_expired(self):
        """Check if document is expired"""
        from django.utils import timezone
        if self.expiry_date:
            return self.expiry_date < timezone.now().date()
        return False

    def create_new_version(self, file_url, file_name, file_size, uploaded_by):
        """
        Create a new version of this document.
        Marks current version as not latest, creates new document with incremented version.
        """
        # Mark current version as not latest
        self.is_latest_version = False
        self.status = 'superseded'
        self.save()

        # Create new version
        new_doc = Document.objects.create(
            document_number=self.document_number,
            title=self.title,
            description=self.description,
            category=self.category,
            file_url=file_url,
            file_name=file_name,
            file_size=file_size,
            file_type=self.file_type,
            file_extension=self.file_extension,
            version=self.version + 1,
            is_latest_version=True,
            previous_version=self,
            content_type=self.content_type,
            object_id=self.object_id,
            uploaded_by=uploaded_by,
            access_level=self.access_level,
            allowed_roles=self.allowed_roles,
            tags=self.tags,
            expiry_date=self.expiry_date,
            status='active'
        )
        # Copy allowed users
        new_doc.allowed_users.set(self.allowed_users.all())
        return new_doc
