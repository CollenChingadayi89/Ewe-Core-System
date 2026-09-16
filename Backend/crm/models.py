from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.validators import zimbabwe_phone_regex, min_value_zero
from core.constants import CURRENCY_CHOICES


class Client(BaseModel):
    """
    Individual clients/customers for SACCO services.
    Can be associated with a Company or independent.
    """
    CLIENT_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('corporate', 'Corporate'),
        ('government', 'Government'),
        ('ngo', 'NGO'),
    ]

    STATUS_CHOICES = [
        ('lead', 'Lead'),
        ('prospect', 'Prospect'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('churned', 'Churned'),
    ]

    CREDIT_RATING_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('unrated', 'Unrated'),
    ]

    client_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Client Number',
        help_text='Unique client identifier (e.g., CLT-2026-001)'
    )
    client_type = models.CharField(
        max_length=20,
        choices=CLIENT_TYPE_CHOICES,
        default='individual',
        verbose_name='Client Type'
    )

    # Personal/Company Information
    first_name = models.CharField(max_length=100, verbose_name='First Name')
    last_name = models.CharField(max_length=100, verbose_name='Last Name')
    company = models.ForeignKey(
        'Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clients',
        verbose_name='Associated Company'
    )
    position = models.CharField(max_length=100, blank=True, null=True, verbose_name='Position/Title')

    # Contact Information
    email = models.EmailField(verbose_name='Email')
    phone = models.CharField(
        max_length=20,
        validators=[zimbabwe_phone_regex],
        verbose_name='Phone Number'
    )
    alternate_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Alternate Phone'
    )
    address = models.TextField(blank=True, null=True, verbose_name='Address')
    city = models.CharField(max_length=50, blank=True, null=True, verbose_name='City')
    country = models.CharField(max_length=50, default='Zimbabwe', verbose_name='Country')

    # Business Details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='lead',
        verbose_name='Status'
    )
    source = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Lead Source',
        help_text='How client was acquired (referral, website, etc.)'
    )
    assigned_to = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_clients',
        verbose_name='Assigned To'
    )

    # Financial
    credit_rating = models.CharField(
        max_length=20,
        choices=CREDIT_RATING_CHOICES,
        default='unrated',
        verbose_name='Credit Rating'
    )
    total_business_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Total Business Value'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    tags = models.JSONField(default=list, blank=True, verbose_name='Tags')

    class Meta:
        db_table = 'crm_client'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client_number']),
            models.Index(fields=['email']),
            models.Index(fields=['status', 'assigned_to']),
        ]

    def __str__(self):
        return f"{self.client_number} - {self.first_name} {self.last_name}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class Company(BaseModel):
    """
    Companies/Organizations that are clients or prospects.
    """
    INDUSTRY_CHOICES = [
        ('agriculture', 'Agriculture'),
        ('manufacturing', 'Manufacturing'),
        ('retail', 'Retail'),
        ('finance', 'Finance'),
        ('technology', 'Technology'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('construction', 'Construction'),
        ('government', 'Government'),
        ('ngo', 'NGO/Non-Profit'),
        ('other', 'Other'),
    ]

    company_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Company Number',
        help_text='Unique company identifier (e.g., COM-2026-001)'
    )
    name = models.CharField(max_length=200, verbose_name='Company Name')
    trading_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Trading Name'
    )
    registration_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Company Registration Number'
    )

    # Contact Information
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[zimbabwe_phone_regex],
        verbose_name='Phone Number'
    )
    website = models.URLField(blank=True, null=True, verbose_name='Website')
    address = models.TextField(blank=True, null=True, verbose_name='Address')
    city = models.CharField(max_length=50, blank=True, null=True, verbose_name='City')
    country = models.CharField(max_length=50, default='Zimbabwe', verbose_name='Country')

    # Business Details
    industry = models.CharField(
        max_length=50,
        choices=INDUSTRY_CHOICES,
        default='other',
        verbose_name='Industry'
    )
    number_of_employees = models.IntegerField(
        blank=True,
        null=True,
        validators=[min_value_zero],
        verbose_name='Number of Employees'
    )
    annual_revenue = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[min_value_zero],
        verbose_name='Annual Revenue'
    )

    # Relationship
    account_manager = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_companies',
        verbose_name='Account Manager'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    tags = models.JSONField(default=list, blank=True, verbose_name='Tags')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        db_table = 'crm_company'
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['name']
        indexes = [
            models.Index(fields=['company_number']),
            models.Index(fields=['name']),
            models.Index(fields=['industry', 'is_active']),
        ]

    def __str__(self):
        return f"{self.company_number} - {self.name}"


class Contact(BaseModel):
    """
    Contact persons within companies or independent contacts.
    """
    CONTACT_TYPE_CHOICES = [
        ('primary', 'Primary Contact'),
        ('secondary', 'Secondary Contact'),
        ('billing', 'Billing Contact'),
        ('technical', 'Technical Contact'),
        ('decision_maker', 'Decision Maker'),
    ]

    contact_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Contact Number',
        help_text='Unique contact identifier (e.g., CNT-2026-001)'
    )

    # Personal Information
    first_name = models.CharField(max_length=100, verbose_name='First Name')
    last_name = models.CharField(max_length=100, verbose_name='Last Name')
    position = models.CharField(max_length=100, blank=True, null=True, verbose_name='Position/Title')
    department = models.CharField(max_length=100, blank=True, null=True, verbose_name='Department')

    # Associations
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='contacts',
        verbose_name='Company'
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts',
        verbose_name='Associated Client'
    )

    # Contact Information
    email = models.EmailField(verbose_name='Email')
    phone = models.CharField(
        max_length=20,
        validators=[zimbabwe_phone_regex],
        verbose_name='Phone Number'
    )
    mobile = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Mobile Number'
    )

    # Contact Details
    contact_type = models.CharField(
        max_length=20,
        choices=CONTACT_TYPE_CHOICES,
        default='secondary',
        verbose_name='Contact Type'
    )
    is_primary = models.BooleanField(default=False, verbose_name='Is Primary Contact')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    birthday = models.DateField(blank=True, null=True, verbose_name='Birthday')
    social_linkedin = models.URLField(blank=True, null=True, verbose_name='LinkedIn Profile')

    class Meta:
        db_table = 'crm_contact'
        verbose_name = 'Contact'
        verbose_name_plural = 'Contacts'
        ordering = ['-is_primary', 'first_name', 'last_name']
        indexes = [
            models.Index(fields=['contact_number']),
            models.Index(fields=['company', 'is_primary']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.contact_number} - {self.get_full_name()} ({self.company.name})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class Deal(BaseModel):
    """
    Sales opportunities/deals in the pipeline.
    """
    STAGE_CHOICES = [
        ('prospecting', 'Prospecting'),
        ('qualification', 'Qualification'),
        ('proposal', 'Proposal'),
        ('negotiation', 'Negotiation'),
        ('closed_won', 'Closed Won'),
        ('closed_lost', 'Closed Lost'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    deal_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Deal Number',
        help_text='Unique deal identifier (e.g., DEL-2026-001)'
    )
    title = models.CharField(max_length=200, verbose_name='Deal Title')
    description = models.TextField(blank=True, null=True, verbose_name='Description')

    # Associations
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='deals',
        verbose_name='Client'
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='deals',
        verbose_name='Company'
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deals',
        verbose_name='Primary Contact'
    )

    # Deal Details
    stage = models.CharField(
        max_length=20,
        choices=STAGE_CHOICES,
        default='prospecting',
        verbose_name='Stage'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priority'
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[min_value_zero],
        verbose_name='Deal Amount'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )
    probability = models.IntegerField(
        default=50,
        verbose_name='Probability (%)',
        help_text='Likelihood of closing (0-100)'
    )
    expected_close_date = models.DateField(verbose_name='Expected Close Date')
    actual_close_date = models.DateField(blank=True, null=True, verbose_name='Actual Close Date')

    # Ownership
    owner = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='owned_deals',
        verbose_name='Deal Owner'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    tags = models.JSONField(default=list, blank=True, verbose_name='Tags')

    class Meta:
        db_table = 'crm_deal'
        verbose_name = 'Deal'
        verbose_name_plural = 'Deals'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['deal_number']),
            models.Index(fields=['stage', 'owner']),
            models.Index(fields=['expected_close_date']),
        ]

    def __str__(self):
        return f"{self.deal_number} - {self.title}"


class Project(BaseModel):
    """
    Client projects with deliverables and milestones.
    """
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    project_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Project Number',
        help_text='Unique project identifier (e.g., PRJ-2026-001)'
    )
    name = models.CharField(max_length=200, verbose_name='Project Name')
    description = models.TextField(blank=True, null=True, verbose_name='Description')

    # Associations
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='projects',
        verbose_name='Client'
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='projects',
        verbose_name='Company'
    )
    deal = models.ForeignKey(
        Deal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='projects',
        verbose_name='Related Deal'
    )

    # Project Details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='planning',
        verbose_name='Status'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priority'
    )
    start_date = models.DateField(verbose_name='Start Date')
    end_date = models.DateField(verbose_name='End Date')
    actual_end_date = models.DateField(blank=True, null=True, verbose_name='Actual End Date')

    # Financial
    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[min_value_zero],
        verbose_name='Budget'
    )
    actual_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Actual Cost'
    )

    # Team
    project_manager = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='managed_projects',
        verbose_name='Project Manager'
    )
    team_members = models.ManyToManyField(
        'hr_employee.Employee',
        related_name='team_projects',
        blank=True,
        verbose_name='Team Members'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    tags = models.JSONField(default=list, blank=True, verbose_name='Tags')
    progress_percentage = models.IntegerField(
        default=0,
        verbose_name='Progress (%)',
        help_text='Project completion percentage (0-100)'
    )

    class Meta:
        db_table = 'crm_project'
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project_number']),
            models.Index(fields=['status', 'project_manager']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.project_number} - {self.name}"


class Ticket(BaseModel):
    """
    Support tickets/issues from clients.
    """
    TYPE_CHOICES = [
        ('bug', 'Bug Report'),
        ('feature', 'Feature Request'),
        ('support', 'Support Request'),
        ('inquiry', 'General Inquiry'),
        ('complaint', 'Complaint'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('pending_customer', 'Pending Customer'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('reopened', 'Reopened'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    ticket_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Ticket Number',
        help_text='Unique ticket identifier (e.g., TKT-2026-00001)'
    )
    subject = models.CharField(max_length=200, verbose_name='Subject')
    description = models.TextField(verbose_name='Description')

    # Associations
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='tickets',
        verbose_name='Client'
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name='Contact Person'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name='Related Project'
    )

    # Ticket Details
    ticket_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='support',
        verbose_name='Type'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='open',
        verbose_name='Status'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priority'
    )

    # Assignment
    assigned_to = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name='Assigned To'
    )

    # Tracking
    resolution = models.TextField(blank=True, null=True, verbose_name='Resolution')
    resolved_at = models.DateTimeField(blank=True, null=True, verbose_name='Resolved At')
    closed_at = models.DateTimeField(blank=True, null=True, verbose_name='Closed At')

    # Additional Info
    tags = models.JSONField(default=list, blank=True, verbose_name='Tags')

    class Meta:
        db_table = 'crm_ticket'
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket_number']),
            models.Index(fields=['status', 'assigned_to']),
            models.Index(fields=['priority', 'created_at']),
        ]

    def __str__(self):
        return f"{self.ticket_number} - {self.subject}"
