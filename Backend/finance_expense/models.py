from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.constants import ApprovalStatus, CURRENCY_CHOICES, PRIORITY_CHOICES


class Expense(BaseModel):
    """
    Employee expense reimbursements.
    Tracks expenses incurred by employees on behalf of SACCO.
    """
    expense_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Expense Number',
        help_text='Unique identifier (e.g., EXP-2026-000001)'
    )

    # Employee Information
    employee = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='expenses',
        verbose_name='Employee'
    )

    # Expense Details
    category = models.CharField(
        max_length=50,
        choices=[
            ('travel', 'Travel'),
            ('accommodation', 'Accommodation'),
            ('meals', 'Meals & Entertainment'),
            ('transport', 'Transport'),
            ('communication', 'Communication'),
            ('office_supplies', 'Office Supplies'),
            ('training', 'Training & Development'),
            ('professional_fees', 'Professional Fees'),
            ('other', 'Other')
        ],
        default='other',
        verbose_name='Category'
    )
    description = models.TextField(verbose_name='Description')

    # Amount Details
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Amount (ZWG)'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )

    # Dates
    expense_date = models.DateField(verbose_name='Expense Date')
    submission_date = models.DateField(auto_now_add=True, verbose_name='Submission Date')

    # Receipt/Documentation
    receipt_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Receipt Number'
    )
    attachments = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Attachments',
        help_text='URLs to receipt/invoice documents'
    )

    # Status & Approval
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('pending', 'Pending Approval'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('paid', 'Paid'),
            ('cancelled', 'Cancelled')
        ],
        default='draft',
        verbose_name='Status'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priority'
    )

    # Approval Workflow
    current_approver = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='pending_expense_approvals',
        verbose_name='Current Approver'
    )
    approval_chain = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Approval Chain',
        help_text='Array of approval steps with approver details'
    )
    approved_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_expenses',
        verbose_name='Approved By'
    )
    approved_date = models.DateTimeField(blank=True, null=True, verbose_name='Approved Date')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Rejection Reason')

    # Payment Details
    paid_date = models.DateField(blank=True, null=True, verbose_name='Date Paid')
    payment_method = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Payment Method'
    )
    payment_reference = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Payment Reference'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Additional Notes')

    class Meta:
        db_table = 'finance_expense'
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
        ordering = ['-expense_date', '-created_at']
        indexes = [
            models.Index(fields=['expense_number']),
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['status', 'current_approver']),
            models.Index(fields=['expense_date']),
        ]

    def __str__(self):
        return f"{self.expense_number} - {self.employee.get_full_name()} (ZWG {self.amount})"
