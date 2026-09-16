from django.contrib import admin
from .models import Employee, EmployeeSalary, EmployeeBankDetails, EmployeeEmergencyContact, EmployeeTax


class EmployeeSalaryInline(admin.TabularInline):
    """Inline admin for employee salary records"""
    model = EmployeeSalary
    extra = 0
    fields = ['basic_salary', 'currency', 'payment_frequency', 'effective_from', 'effective_to', 'is_current']
    readonly_fields = ['created_at']


class EmployeeBankDetailsInline(admin.TabularInline):
    """Inline admin for employee bank details"""
    model = EmployeeBankDetails
    extra = 0
    fields = ['bank_name', 'account_number', 'account_holder_name', 'is_primary', 'is_active']


class EmployeeEmergencyContactInline(admin.TabularInline):
    """Inline admin for emergency contacts"""
    model = EmployeeEmergencyContact
    extra = 0
    fields = ['name', 'relationship', 'phone', 'is_primary']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    """Admin interface for Employee model"""
    list_display = ['employee_number', 'get_full_name', 'department', 'designation', 'employment_status', 'is_active', 'join_date']
    list_filter = ['employment_status', 'department', 'is_active', 'join_date']
    search_fields = ['employee_number', 'first_name', 'last_name', 'user__email']
    ordering = ['employee_number']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']
    inlines = [EmployeeSalaryInline, EmployeeBankDetailsInline, EmployeeEmergencyContactInline]

    fieldsets = (
        ('User Account', {
            'fields': ('user',)
        }),
        ('Employee Identification', {
            'fields': ('employee_number',)
        }),
        ('Personal Information', {
            'fields': ('first_name', 'middle_name', 'last_name', 'gender', 'date_of_birth', 'nationality',
                      'marital_status', 'religion', 'blood_group', 'number_of_children', 'spouse_employed')
        }),
        ('Contact Information', {
            'fields': ('phone', 'personal_email', 'address', 'city', 'state', 'postal_code', 'country')
        }),
        ('Employment Information', {
            'fields': ('department', 'designation', 'role', 'reports_to', 'employment_status',
                      'join_date', 'confirmation_date', 'probation_end_date')
        }),
        ('Contract Information', {
            'fields': ('contract_start_date', 'contract_end_date'),
            'classes': ('collapse',)
        }),
        ('Exit Information', {
            'fields': ('resignation_date', 'termination_date', 'exit_notes'),
            'classes': ('collapse',)
        }),
        ('Identification Documents', {
            'fields': ('national_id', 'passport_number', 'passport_expiry_date',
                      'work_permit_number', 'work_permit_expiry_date'),
            'classes': ('collapse',)
        }),
        ('Profile', {
            'fields': ('avatar', 'bio', 'skills', 'certifications', 'education', 'experience'),
            'classes': ('collapse',)
        }),
        ('Performance', {
            'fields': ('projects_assigned', 'tasks_completed', 'productivity_score',
                      'last_performance_review', 'next_performance_review'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmployeeSalary)
class EmployeeSalaryAdmin(admin.ModelAdmin):
    """Admin interface for Employee Salary model"""
    list_display = ['employee', 'basic_salary', 'currency', 'payment_frequency', 'effective_from', 'effective_to', 'is_current']
    list_filter = ['currency', 'payment_frequency', 'is_current', 'effective_from']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_number']
    ordering = ['-effective_from']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Employee', {
            'fields': ('employee',)
        }),
        ('Salary Information', {
            'fields': ('basic_salary', 'currency', 'payment_frequency')
        }),
        ('Allowances', {
            'fields': ('housing_allowance', 'transport_allowance', 'medical_allowance', 'other_allowances')
        }),
        ('Effective Period', {
            'fields': ('effective_from', 'effective_to', 'is_current')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmployeeBankDetails)
class EmployeeBankDetailsAdmin(admin.ModelAdmin):
    """Admin interface for Employee Bank Details model"""
    list_display = ['employee', 'bank_name', 'account_number', 'account_type', 'is_primary', 'is_active']
    list_filter = ['bank_name', 'account_type', 'is_primary', 'is_active']
    search_fields = ['employee__first_name', 'employee__last_name', 'account_number', 'bank_name']
    ordering = ['employee', '-is_primary']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Employee', {
            'fields': ('employee',)
        }),
        ('Bank Information', {
            'fields': ('bank_name', 'branch', 'branch_code')
        }),
        ('Account Details', {
            'fields': ('account_number', 'account_holder_name', 'account_type')
        }),
        ('International Details', {
            'fields': ('swift_code', 'iban'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_primary', 'is_active')
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmployeeEmergencyContact)
class EmployeeEmergencyContactAdmin(admin.ModelAdmin):
    """Admin interface for Employee Emergency Contact model"""
    list_display = ['employee', 'name', 'relationship', 'phone', 'is_primary']
    list_filter = ['relationship', 'is_primary']
    search_fields = ['employee__first_name', 'employee__last_name', 'name', 'phone']
    ordering = ['employee', '-is_primary']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Employee', {
            'fields': ('employee',)
        }),
        ('Contact Information', {
            'fields': ('name', 'relationship', 'phone', 'alternate_phone', 'email')
        }),
        ('Address', {
            'fields': ('address',)
        }),
        ('Status', {
            'fields': ('is_primary',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmployeeTax)
class EmployeeTaxAdmin(admin.ModelAdmin):
    """Admin interface for Employee Tax Information model"""
    list_display = ['employee', 'tax_reference_number', 'nssa_number', 'medical_aid_provider']
    search_fields = ['employee__first_name', 'employee__last_name', 'tax_reference_number', 'nssa_number']
    ordering = ['employee']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Employee', {
            'fields': ('employee',)
        }),
        ('Zimbabwe Statutory Numbers', {
            'fields': ('tax_reference_number', 'nssa_number', 'pension_fund_number')
        }),
        ('Medical Aid', {
            'fields': ('medical_aid_number', 'medical_aid_provider')
        }),
        ('Tax Exemptions', {
            'fields': ('tax_exemption_certificate', 'disability_exemption', 'number_of_dependents')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )
