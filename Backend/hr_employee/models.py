from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.validators import (
    zimbabwe_phone_regex,
    employee_number_regex,
    validate_reasonable_date_of_birth,
    validate_past_date,
    validate_salary_range,
    min_value_zero,
    validate_positive_decimal
)
from core.constants import (
    UserRole,
    EmploymentStatus,
    Gender,
    MaritalStatus,
    BLOOD_GROUP_CHOICES,
    PaymentFrequency,
    CURRENCY_CHOICES
)


class Employee(BaseModel):
    """
    Comprehensive employee profile model.
    Stores all employee information separate from User authentication.
    """
    # Link to User account (ONE-TO-ONE)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        verbose_name='User Account'
    )

    # Employee Identification
    employee_number = models.CharField(
        max_length=20,
        unique=True,
        validators=[employee_number_regex],
        verbose_name='Employee Number',
        help_text='Unique employee identifier (e.g., EMP001)'
    )

    # Personal Information
    first_name = models.CharField(max_length=50, verbose_name='First Name')
    middle_name = models.CharField(max_length=50, blank=True, null=True, verbose_name='Middle Name')
    last_name = models.CharField(max_length=50, verbose_name='Last Name')
    gender = models.CharField(max_length=20, choices=Gender.CHOICES, blank=True, null=True, verbose_name='Gender')
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        validators=[validate_reasonable_date_of_birth],
        verbose_name='Date of Birth'
    )
    nationality = models.CharField(max_length=50, blank=True, null=True, verbose_name='Nationality')
    marital_status = models.CharField(max_length=20, choices=MaritalStatus.CHOICES, blank=True, null=True, verbose_name='Marital Status')
    religion = models.CharField(max_length=50, blank=True, null=True, verbose_name='Religion')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True, null=True, verbose_name='Blood Group')
    number_of_children = models.IntegerField(default=0, blank=True, null=True, verbose_name='Number of Children')
    spouse_employed = models.BooleanField(default=False, blank=True, null=True, verbose_name='Is Spouse Employed')

    # Contact Information
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[zimbabwe_phone_regex],
        verbose_name='Phone Number'
    )
    personal_email = models.EmailField(blank=True, null=True, verbose_name='Personal Email')
    address = models.TextField(blank=True, null=True, verbose_name='Residential Address')
    city = models.CharField(max_length=50, blank=True, null=True, verbose_name='City')
    state = models.CharField(max_length=50, blank=True, null=True, verbose_name='State/Province')
    postal_code = models.CharField(max_length=20, blank=True, null=True, verbose_name='Postal Code')
    country = models.CharField(max_length=50, default='Zimbabwe', verbose_name='Country')

    # Employment Information
    department = models.ForeignKey(
        'hr_department.Department',
        on_delete=models.PROTECT,
        related_name='employees',
        verbose_name='Department'
    )
    designation = models.ForeignKey(
        'hr_department.Designation',
        on_delete=models.PROTECT,
        related_name='employees',
        verbose_name='Designation'
    )
    role = models.CharField(max_length=20, choices=UserRole.CHOICES, default=UserRole.EMPLOYEE, verbose_name='System Role')
    reports_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinates',
        verbose_name='Reports To'
    )
    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.CHOICES,
        default=EmploymentStatus.PERMANENT,
        verbose_name='Employment Status'
    )
    join_date = models.DateField(verbose_name='Join Date')
    confirmation_date = models.DateField(blank=True, null=True, verbose_name='Confirmation Date')
    probation_end_date = models.DateField(blank=True, null=True, verbose_name='Probation End Date')
    contract_start_date = models.DateField(blank=True, null=True, verbose_name='Contract Start Date')
    contract_end_date = models.DateField(blank=True, null=True, verbose_name='Contract End Date')
    resignation_date = models.DateField(blank=True, null=True, verbose_name='Resignation Date')
    termination_date = models.DateField(blank=True, null=True, verbose_name='Termination Date')
    exit_notes = models.TextField(blank=True, null=True, verbose_name='Exit Notes')

    # Identification Documents
    # TODO: Implement application-layer encryption for sensitive fields (national_id, passport_number, work_permit_number)
    national_id = models.CharField(max_length=200, blank=True, null=True, verbose_name='National ID Number')
    passport_number = models.CharField(max_length=200, blank=True, null=True, verbose_name='Passport Number')
    passport_expiry_date = models.DateField(blank=True, null=True, verbose_name='Passport Expiry Date')
    work_permit_number = models.CharField(max_length=200, blank=True, null=True, verbose_name='Work Permit Number')
    work_permit_expiry_date = models.DateField(blank=True, null=True, verbose_name='Work Permit Expiry Date')

    # Profile Information
    avatar = models.ImageField(upload_to='employee_avatars/', blank=True, null=True, verbose_name='Profile Photo')
    bio = models.TextField(blank=True, null=True, verbose_name='Biography')
    skills = models.JSONField(default=list, blank=True, verbose_name='Skills')
    certifications = models.JSONField(default=list, blank=True, verbose_name='Certifications')
    education = models.JSONField(default=list, blank=True, verbose_name='Education History')
    experience = models.JSONField(default=list, blank=True, verbose_name='Work Experience')

    # Performance & Productivity
    projects_assigned = models.IntegerField(default=0, blank=True, null=True, verbose_name='Projects Assigned')
    tasks_completed = models.IntegerField(default=0, blank=True, null=True, verbose_name='Tasks Completed')
    productivity_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name='Productivity Score (%)')
    last_performance_review = models.DateField(blank=True, null=True, verbose_name='Last Performance Review Date')
    next_performance_review = models.DateField(blank=True, null=True, verbose_name='Next Performance Review Date')

    # Status
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        db_table = 'hr_employee'
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['employee_number']
        indexes = [
            models.Index(fields=['employee_number']),
            models.Index(fields=['first_name', 'last_name']),
            models.Index(fields=['department', 'is_active']),
            models.Index(fields=['employment_status']),
        ]

    def __str__(self):
        return f"{self.employee_number} - {self.get_full_name()}"

    def get_full_name(self):
        """Return full name"""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"


class EmployeeSalary(BaseModel):
    """
    Employee salary and compensation information.
    Supports salary history tracking.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='salary_records',
        verbose_name='Employee'
    )
    basic_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[validate_salary_range, validate_positive_decimal],
        verbose_name='Basic Salary'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )
    payment_frequency = models.CharField(
        max_length=20,
        choices=PaymentFrequency.CHOICES,
        default=PaymentFrequency.MONTHLY,
        verbose_name='Payment Frequency'
    )

    # Allowances
    housing_allowance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Housing Allowance'
    )
    transport_allowance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Transport Allowance'
    )
    medical_allowance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Medical Allowance'
    )
    other_allowances = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Other Allowances'
    )

    # Effective dates
    effective_from = models.DateField(verbose_name='Effective From')
    effective_to = models.DateField(blank=True, null=True, verbose_name='Effective To')

    # Additional info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    is_current = models.BooleanField(default=True, verbose_name='Is Current Salary')

    class Meta:
        db_table = 'hr_employee_salary'
        verbose_name = 'Employee Salary'
        verbose_name_plural = 'Employee Salaries'
        ordering = ['-effective_from']
        indexes = [
            models.Index(fields=['employee', 'is_current']),
            models.Index(fields=['effective_from', 'effective_to']),
        ]

    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.currency} {self.basic_salary} ({self.payment_frequency})"

    def get_gross_salary(self):
        """Calculate gross salary (basic + all allowances)"""
        return (
            self.basic_salary +
            self.housing_allowance +
            self.transport_allowance +
            self.medical_allowance +
            self.other_allowances
        )


class EmployeeBankDetails(BaseModel):
    """
    Employee banking information for salary payments.
    TODO: Implement application-layer encryption for sensitive fields (account_number, swift_code, iban)
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='bank_accounts',
        verbose_name='Employee'
    )
    bank_name = models.CharField(max_length=100, verbose_name='Bank Name')
    branch = models.CharField(max_length=100, blank=True, null=True, verbose_name='Branch Name')
    branch_code = models.CharField(max_length=20, blank=True, null=True, verbose_name='Branch Code')
    account_number = models.CharField(max_length=200, verbose_name='Account Number')
    account_holder_name = models.CharField(max_length=100, verbose_name='Account Holder Name')
    swift_code = models.CharField(max_length=200, blank=True, null=True, verbose_name='SWIFT/BIC Code')
    iban = models.CharField(max_length=200, blank=True, null=True, verbose_name='IBAN')
    account_type = models.CharField(
        max_length=20,
        choices=[('savings', 'Savings'), ('checking', 'Checking/Current')],
        default='savings',
        verbose_name='Account Type'
    )
    is_primary = models.BooleanField(default=True, verbose_name='Is Primary Account')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        db_table = 'hr_employee_bank_details'
        verbose_name = 'Employee Bank Detail'
        verbose_name_plural = 'Employee Bank Details'
        ordering = ['-is_primary', 'bank_name']
        indexes = [
            models.Index(fields=['employee', 'is_primary']),
        ]

    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.bank_name} ({self.account_number})"


class EmployeeEmergencyContact(BaseModel):
    """
    Emergency contact information for employees.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='emergency_contacts',
        verbose_name='Employee'
    )
    name = models.CharField(max_length=100, verbose_name='Contact Name')
    relationship = models.CharField(max_length=50, verbose_name='Relationship')
    phone = models.CharField(max_length=20, verbose_name='Phone Number')
    alternate_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Alternate Phone')
    email = models.EmailField(blank=True, null=True, verbose_name='Email Address')
    address = models.TextField(blank=True, null=True, verbose_name='Address')
    is_primary = models.BooleanField(default=False, verbose_name='Is Primary Contact')

    class Meta:
        db_table = 'hr_employee_emergency_contact'
        verbose_name = 'Emergency Contact'
        verbose_name_plural = 'Emergency Contacts'
        ordering = ['-is_primary', 'name']
        indexes = [
            models.Index(fields=['employee', 'is_primary']),
        ]

    def __str__(self):
        return f"{self.name} ({self.relationship}) - Emergency contact for {self.employee.get_full_name()}"


class EmployeeTax(BaseModel):
    """
    Employee tax and statutory information (Zimbabwe specific).
    TODO: Implement application-layer encryption for statutory numbers
    """
    employee = models.OneToOneField(
        Employee,
        on_delete=models.CASCADE,
        related_name='tax_info',
        verbose_name='Employee'
    )

    # Zimbabwe Statutory Numbers
    tax_reference_number = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Tax Reference Number (TIN)',
        help_text='Zimbabwe Revenue Authority (ZIMRA) Tax Identification Number'
    )
    nssa_number = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='NSSA Number',
        help_text='National Social Security Authority registration number'
    )
    pension_fund_number = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Pension Fund Number'
    )
    medical_aid_number = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Medical Aid Number'
    )
    medical_aid_provider = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Medical Aid Provider'
    )

    # Tax-related fields
    tax_exemption_certificate = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tax Exemption Certificate Number'
    )
    disability_exemption = models.BooleanField(default=False, verbose_name='Disability Tax Exemption')
    number_of_dependents = models.IntegerField(default=0, verbose_name='Number of Tax Dependents')

    # Additional info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        db_table = 'hr_employee_tax'
        verbose_name = 'Employee Tax Information'
        verbose_name_plural = 'Employee Tax Information'

    def __str__(self):
        return f"Tax Info - {self.employee.get_full_name()}"
