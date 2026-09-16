from django.db import models
from django.conf import settings
from core.models import BaseModel


class Onboarding(BaseModel):
    """
    New employee onboarding workflow tracking.
    Manages the process of bringing new employees into the organization.
    """
    # Employee Information
    employee = models.OneToOneField(
        'hr_employee.Employee',
        on_delete=models.CASCADE,
        related_name='onboarding',
        verbose_name='Employee'
    )

    # Onboarding Details
    onboarding_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Onboarding Number',
        help_text='Unique identifier (e.g., ONB-2026-000001)'
    )
    start_date = models.DateField(verbose_name='Onboarding Start Date')
    expected_completion_date = models.DateField(verbose_name='Expected Completion Date')
    actual_completion_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Actual Completion Date'
    )

    # Assignment
    assigned_buddy = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='onboarding_buddies',
        verbose_name='Assigned Buddy',
        help_text='Experienced employee assigned to help new hire'
    )
    hr_coordinator = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='onboarding_coordinations',
        verbose_name='HR Coordinator',
        help_text='HR staff member coordinating onboarding'
    )

    # Checklist Progress
    checklist = models.JSONField(
        default=list,
        verbose_name='Onboarding Checklist',
        help_text='''Array of checklist items with structure:
        [
            {
                "id": "1",
                "category": "Pre-Arrival",
                "task": "Send welcome email",
                "responsible": "HR",
                "due_date": "2026-09-10",
                "completed": true,
                "completed_date": "2026-09-09",
                "completed_by": "user_id",
                "notes": "Email sent successfully"
            },
            ...
        ]
        Categories: Pre-Arrival, First Day, First Week, First Month, 90 Days
        '''
    )
    total_tasks = models.IntegerField(default=0, verbose_name='Total Tasks')
    completed_tasks = models.IntegerField(default=0, verbose_name='Completed Tasks')
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='Completion Percentage (%)'
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('not_started', 'Not Started'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('on_hold', 'On Hold'),
            ('cancelled', 'Cancelled')
        ],
        default='not_started',
        verbose_name='Status'
    )

    # Feedback & Assessment
    feedback_30_days = models.TextField(
        blank=True,
        null=True,
        verbose_name='30-Day Feedback',
        help_text='Feedback from 30-day check-in'
    )
    feedback_60_days = models.TextField(
        blank=True,
        null=True,
        verbose_name='60-Day Feedback',
        help_text='Feedback from 60-day check-in'
    )
    feedback_90_days = models.TextField(
        blank=True,
        null=True,
        verbose_name='90-Day Feedback',
        help_text='Feedback from 90-day review'
    )
    probation_passed = models.BooleanField(
        default=False,
        verbose_name='Probation Passed',
        help_text='True if employee successfully completed probation period'
    )

    # Equipment & Access
    equipment_issued = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Equipment Issued',
        help_text='Array of asset IDs or equipment descriptions issued to employee'
    )
    access_granted = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Access Granted',
        help_text='''Array of system access details:
        [
            {
                "system": "Email",
                "username": "john.doe@ewesacco.org",
                "granted_date": "2026-09-10",
                "granted_by": "user_id"
            },
            ...
        ]
        '''
    )

    # Training
    training_completed = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Training Completed',
        help_text='''Array of completed training sessions:
        [
            {
                "training_name": "SACCO Policies & Procedures",
                "completion_date": "2026-09-15",
                "trainer": "Margaret Njeri",
                "duration_hours": 4
            },
            ...
        ]
        '''
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Additional Notes')

    class Meta:
        db_table = 'onboarding'
        verbose_name = 'Onboarding'
        verbose_name_plural = 'Onboardings'
        ordering = ['-start_date', '-created_at']
        indexes = [
            models.Index(fields=['onboarding_number']),
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['hr_coordinator', 'status']),
        ]

    def __str__(self):
        return f"{self.onboarding_number} - {self.employee.get_full_name()}"

    def save(self, *args, **kwargs):
        """Auto-calculate completion percentage"""
        if self.total_tasks > 0:
            self.completion_percentage = (self.completed_tasks / self.total_tasks) * 100
        else:
            self.completion_percentage = 0
        super().save(*args, **kwargs)

    def update_checklist_progress(self):
        """
        Recalculate total and completed tasks from checklist JSON.
        Call this after updating the checklist field.
        """
        self.total_tasks = len(self.checklist)
        self.completed_tasks = sum(1 for item in self.checklist if item.get('completed', False))
        self.save()

    def is_overdue(self):
        """Check if onboarding is overdue"""
        from django.utils import timezone
        if self.status in ['not_started', 'in_progress']:
            return self.expected_completion_date < timezone.now().date()
        return False
