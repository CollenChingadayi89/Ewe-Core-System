"""
HR Employee Serializers
Comprehensive serializers for employee management with nested relationships.
Excludes sensitive fields from list views for security.
"""

from rest_framework import serializers
from .models import Employee, EmployeeSalary, EmployeeBankDetails, EmployeeEmergencyContact, EmployeeTax, EmployeeDocument


class UserBriefSerializer(serializers.Serializer):
    """Brief user information for nested display"""
    id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    last_login = serializers.DateTimeField(read_only=True)


class DepartmentBriefSerializer(serializers.Serializer):
    """Brief department information for nested display"""
    id = serializers.UUIDField(read_only=True)
    code = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)


class DesignationBriefSerializer(serializers.Serializer):
    """Brief designation information for nested display"""
    id = serializers.UUIDField(read_only=True)
    code = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    level = serializers.CharField(read_only=True, allow_null=True)


class CurrentSalarySerializer(serializers.ModelSerializer):
    """Serializer for current salary information"""
    gross_salary = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
        source='get_gross_salary'
    )

    class Meta:
        model = EmployeeSalary
        fields = [
            'id',
            'basic_salary',
            'currency',
            'payment_frequency',
            'housing_allowance',
            'transport_allowance',
            'medical_allowance',
            'other_allowances',
            'gross_salary',
            'effective_from',
        ]
        read_only_fields = ['id']


class EmployeeListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for employee list views.
    Excludes sensitive fields (national_id, passport, bank details).
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_title = serializers.CharField(source='designation.title', read_only=True)
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id',
            'user',
            'user_email',
            'employee_number',
            'first_name',
            'middle_name',
            'last_name',
            'gender',
            'phone',
            'department',
            'department_name',
            'designation',
            'designation_title',
            'role',
            'reports_to',
            'manager_name',
            'employment_status',
            'join_date',
            'avatar',
            'is_active',
        ]
        read_only_fields = ['id']

    def get_manager_name(self, obj):
        """Get manager's full name"""
        if obj.reports_to:
            return obj.reports_to.get_full_name()
        return None


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for employee detail views.
    Includes nested user, department, salary, but excludes highly sensitive fields.
    """
    user_details = UserBriefSerializer(source='user', read_only=True)
    department_details = DepartmentBriefSerializer(source='department', read_only=True)
    designation_details = DesignationBriefSerializer(source='designation', read_only=True)
    manager_details = serializers.SerializerMethodField()
    current_salary = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            # Basic Info
            'id',
            'user',
            'user_details',
            'employee_number',

            # Personal Info
            'first_name',
            'middle_name',
            'last_name',
            'gender',
            'date_of_birth',
            'nationality',
            'marital_status',
            'religion',
            'blood_group',
            'number_of_children',
            'spouse_employed',

            # Contact Info
            'phone',
            'personal_email',
            'address',
            'city',
            'state',
            'postal_code',
            'country',

            # Employment Info
            'department',
            'department_details',
            'designation',
            'designation_details',
            'role',
            'reports_to',
            'manager_details',
            'employment_status',
            'join_date',
            'confirmation_date',
            'probation_end_date',
            'contract_start_date',
            'contract_end_date',
            'resignation_date',
            'termination_date',
            'exit_notes',

            # Documents (IDs excluded for security - separate endpoint)
            'passport_expiry_date',
            'work_permit_expiry_date',

            # Profile
            'avatar',
            'bio',
            'skills',
            'certifications',
            'education',
            'experience',

            # Performance
            'projects_assigned',
            'tasks_completed',
            'productivity_score',
            'last_performance_review',
            'next_performance_review',

            # Status
            'is_active',
            'created_at',
            'updated_at',

            # Nested Data
            'current_salary',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_manager_details(self, obj):
        """Get manager information"""
        if obj.reports_to:
            return {
                'id': str(obj.reports_to.id),
                'employee_number': obj.reports_to.employee_number,
                'first_name': obj.reports_to.first_name,
                'last_name': obj.reports_to.last_name,
                'designation': obj.reports_to.designation.title if obj.reports_to.designation else None,
            }
        return None

    def get_current_salary(self, obj):
        """Get current salary information (if user has permission)"""
        # Only return salary for HR or the employee themselves
        request = self.context.get('request')
        if not request:
            return None

        user = request.user
        is_hr = (user.is_staff or user.is_superuser or
                (hasattr(user, 'employee_profile') and
                 user.employee_profile.role in ['hr_manager', 'hr_employee']))
        is_self = (hasattr(user, 'employee_profile') and
                  user.employee_profile.id == obj.id)

        if is_hr or is_self:
            current_salary = obj.salary_records.filter(is_current=True).first()
            if current_salary:
                return CurrentSalarySerializer(current_salary).data

        return None


class EmployeeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating employees"""

    class Meta:
        model = Employee
        fields = [
            'user',
            'employee_number',
            'first_name',
            'middle_name',
            'last_name',
            'gender',
            'date_of_birth',
            'nationality',
            'marital_status',
            'religion',
            'blood_group',
            'number_of_children',
            'spouse_employed',
            'phone',
            'personal_email',
            'address',
            'city',
            'state',
            'postal_code',
            'country',
            'department',
            'designation',
            'role',
            'reports_to',
            'employment_status',
            'join_date',
            'confirmation_date',
            'probation_end_date',
            'contract_start_date',
            'contract_end_date',
            'avatar',
            'bio',
            'skills',
            'certifications',
            'education',
            'experience',
            'is_active',
        ]
        read_only_fields = ['id']

    def validate_reports_to(self, value):
        """Prevent employee from reporting to themselves"""
        if value and self.instance and value.id == self.instance.id:
            raise serializers.ValidationError("Employee cannot report to themselves.")
        return value


# ============================================================================
# RELATED MODELS SERIALIZERS
# ============================================================================

class EmployeeSalarySerializer(serializers.ModelSerializer):
    """Serializer for employee salary records"""
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    gross_salary = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
        source='get_gross_salary'
    )

    class Meta:
        model = EmployeeSalary
        fields = [
            'id',
            'employee',
            'employee_name',
            'basic_salary',
            'currency',
            'payment_frequency',
            'housing_allowance',
            'transport_allowance',
            'medical_allowance',
            'other_allowances',
            'gross_salary',
            'effective_from',
            'effective_to',
            'notes',
            'is_current',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'gross_salary']

    def validate(self, attrs):
        """Validate salary dates"""
        effective_from = attrs.get('effective_from')
        effective_to = attrs.get('effective_to')

        if effective_from and effective_to and effective_from > effective_to:
            raise serializers.ValidationError({
                'effective_to': 'End date must be after start date.'
            })

        return attrs


class EmployeeBankDetailsSerializer(serializers.ModelSerializer):
    """
    Serializer for employee bank details.
    Note: Sensitive fields (account_number, swift_code, iban) should be encrypted at model level.
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = EmployeeBankDetails
        fields = [
            'id',
            'employee',
            'employee_name',
            'bank_name',
            'branch',
            'branch_code',
            'account_number',
            'account_holder_name',
            'swift_code',
            'iban',
            'account_type',
            'is_primary',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmployeeEmergencyContactSerializer(serializers.ModelSerializer):
    """Serializer for employee emergency contacts"""
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = EmployeeEmergencyContact
        fields = [
            'id',
            'employee',
            'employee_name',
            'name',
            'relationship',
            'phone',
            'alternate_phone',
            'email',
            'address',
            'is_primary',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmployeeTaxSerializer(serializers.ModelSerializer):
    """
    Serializer for employee tax information.
    Note: Sensitive fields should be encrypted at model level.
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = EmployeeTax
        fields = [
            'id',
            'employee',
            'employee_name',
            'tax_reference_number',
            'nssa_number',
            'pension_fund_number',
            'medical_aid_number',
            'medical_aid_provider',
            'tax_exemption_certificate',
            'disability_exemption',
            'number_of_dependents',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for employee documents with file upload support.
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True, allow_null=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = EmployeeDocument
        fields = [
            'id',
            'employee',
            'employee_name',
            'document_type',
            'document_type_display',
            'file',
            'file_url',
            'file_name',
            'file_size',
            'file_type',
            'title',
            'notes',
            'expiry_date',
            'is_expired',
            'is_verified',
            'verified_by',
            'verified_by_name',
            'verified_at',
            'uploaded_by',
            'uploaded_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'file_name',
            'file_size',
            'file_type',
            'uploaded_by',
            'created_at',
            'updated_at',
            'verified_by',
            'verified_at'
        ]

    def get_file_url(self, obj):
        """Get the full URL for the file"""
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def create(self, validated_data):
        """Set uploaded_by from request user and extract file metadata"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['uploaded_by'] = request.user

        # Extract file metadata from uploaded file
        uploaded_file = validated_data.get('file')
        if uploaded_file:
            validated_data['file_name'] = uploaded_file.name
            validated_data['file_size'] = uploaded_file.size
            validated_data['file_type'] = uploaded_file.content_type

        return super().create(validated_data)
