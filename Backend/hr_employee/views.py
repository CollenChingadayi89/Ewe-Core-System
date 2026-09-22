"""
HR Employee ViewSets
Provides API endpoints for employee management with advanced filtering and custom actions.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Employee, EmployeeSalary, EmployeeBankDetails, EmployeeEmergencyContact, EmployeeTax, EmployeeDocument
from .serializers import (
    EmployeeListSerializer,
    EmployeeDetailSerializer,
    EmployeeCreateUpdateSerializer,
    EmployeeSalarySerializer,
    EmployeeBankDetailsSerializer,
    EmployeeEmergencyContactSerializer,
    EmployeeTaxSerializer,
    EmployeeDocumentSerializer,
)
from accounts.permissions import IsHROrReadOnly, IsOwnerOrHR


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee management.

    List: Returns lightweight employee list with department and designation names
    Retrieve: Returns detailed employee profile with nested relationships
    Create/Update: Accepts employee data

    Custom Actions:
    - leave_balances: GET /employees/{id}/leave_balances/ - Get employee's leave balances

    Filters:
    - is_active: Filter by active status
    - department: Filter by department ID
    - designation: Filter by designation ID
    - role: Filter by system role
    - employment_status: Filter by employment status
    - Search: employee_number, first_name, last_name, email, phone
    - Ordering: employee_number, first_name, last_name, join_date, created_at
    """
    queryset = Employee.objects.select_related(
        'user',
        'department',
        'designation',
        'reports_to'
    ).prefetch_related('salary_records')

    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'employee_number',
        'first_name',
        'last_name',
        'user__email',
        'phone',
        'personal_email'
    ]

    # Filter configuration
    filterset_fields = [
        'is_active',
        'department',
        'designation',
        'role',
        'employment_status',
        'gender',
        'marital_status'
    ]

    # Ordering configuration
    ordering_fields = [
        'employee_number',
        'first_name',
        'last_name',
        'join_date',
        'created_at'
    ]
    ordering = ['employee_number']  # Default ordering

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return EmployeeListSerializer
        elif self.action == 'retrieve':
            return EmployeeDetailSerializer
        return EmployeeCreateUpdateSerializer

    def get_queryset(self):
        """
        Optimize queryset based on action and user permissions.
        Regular employees can only see active employees.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # HR and admins see all employees
        if user.is_staff or user.is_superuser:
            return queryset

        # Check if user has HR role
        if hasattr(user, 'employee_profile'):
            if user.employee_profile.role in ['hr_manager', 'hr_employee']:
                return queryset

        # Regular employees only see active employees
        return queryset.filter(is_active=True)

    @action(detail=True, methods=['get'], url_path='leave-balances')
    def leave_balances(self, request, pk=None):
        """
        Get leave balances for a specific employee.
        Calculates balances from leave transactions (ledger-based system).

        Returns:
        {
            "employee_id": "uuid",
            "employee_name": "First Last",
            "balances": [
                {
                    "leave_type": "annual",
                    "leave_type_name": "Annual Leave",
                    "total_accrued": 30.0,
                    "total_used": 5.0,
                    "total_approved_future": 3.0,
                    "available_balance": 22.0
                },
                ...
            ]
        }
        """
        employee = self.get_object()

        # Import here to avoid circular imports
        from hr_leave.models import LeaveTransaction, LeavePolicy

        # Get all leave types
        leave_policies = LeavePolicy.objects.filter(is_active=True)

        balances = []
        for policy in leave_policies:
            # Calculate balance from transactions
            transactions = LeaveTransaction.objects.filter(
                employee=employee,
                leave_type=policy.leave_type
            )

            total_accrued = sum(
                t.amount for t in transactions
                if t.transaction_type in ['accrual', 'adjustment', 'carryforward']
            )

            total_used = sum(
                t.amount for t in transactions
                if t.transaction_type in ['usage', 'approval_reservation']
            )

            total_reversed = sum(
                t.amount for t in transactions
                if t.transaction_type == 'cancellation_reversal'
            )

            # Get approved future leave (reservations)
            approved_future = sum(
                t.amount for t in transactions
                if t.transaction_type == 'approval_reservation'
            )

            available_balance = total_accrued - total_used + total_reversed

            balances.append({
                'leave_type': policy.leave_type,
                'leave_type_name': policy.name,
                'total_accrued': float(total_accrued),
                'total_used': float(total_used),
                'total_approved_future': float(approved_future),
                'available_balance': float(available_balance),
                'policy_entitlement': float(policy.days_per_year) if policy.days_per_year else None,
            })

        return Response({
            'employee_id': str(employee.id),
            'employee_name': employee.get_full_name(),
            'employee_number': employee.employee_number,
            'balances': balances
        })


class EmployeeSalaryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee Salary management.
    Restricted to HR staff only.

    Filters:
    - employee: Filter by employee ID
    - is_current: Filter current salaries
    - currency: Filter by currency
    - payment_frequency: Filter by payment frequency
    """
    queryset = EmployeeSalary.objects.select_related('employee', 'employee__user')
    serializer_class = EmployeeSalarySerializer
    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_number']

    # Filter configuration
    filterset_fields = ['employee', 'is_current', 'currency', 'payment_frequency']

    # Ordering configuration
    ordering_fields = ['effective_from', 'basic_salary', 'created_at']
    ordering = ['-effective_from']  # Latest first

    def get_queryset(self):
        """
        Only HR and the employee themselves can view salary information.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admins see all
        if user.is_staff or user.is_superuser:
            return queryset

        # HR sees all
        if hasattr(user, 'employee_profile'):
            if user.employee_profile.role in ['hr_manager', 'hr_employee']:
                return queryset

            # Regular employees only see their own salary
            return queryset.filter(employee__user=user)

        # No employee profile = no salary data
        return queryset.none()


class EmployeeBankDetailsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee Bank Details.
    Restricted to HR and the employee themselves.

    Filters:
    - employee: Filter by employee ID
    - is_primary: Filter primary accounts
    - is_active: Filter active accounts
    """
    queryset = EmployeeBankDetails.objects.select_related('employee', 'employee__user')
    serializer_class = EmployeeBankDetailsSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrHR]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = ['employee__first_name', 'employee__last_name', 'bank_name', 'account_holder_name']

    # Filter configuration
    filterset_fields = ['employee', 'is_primary', 'is_active', 'account_type']

    # Ordering configuration
    ordering_fields = ['bank_name', 'created_at']
    ordering = ['-is_primary', 'bank_name']

    def get_queryset(self):
        """
        Only HR and the employee themselves can view bank details.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admins see all
        if user.is_staff or user.is_superuser:
            return queryset

        # HR sees all
        if hasattr(user, 'employee_profile'):
            if user.employee_profile.role in ['hr_manager', 'hr_employee']:
                return queryset

            # Regular employees only see their own bank details
            return queryset.filter(employee__user=user)

        return queryset.none()


class EmployeeEmergencyContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee Emergency Contacts.
    HR and the employee can view/edit.

    Filters:
    - employee: Filter by employee ID
    - is_primary: Filter primary contacts
    """
    queryset = EmployeeEmergencyContact.objects.select_related('employee', 'employee__user')
    serializer_class = EmployeeEmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrHR]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = ['employee__first_name', 'employee__last_name', 'name', 'relationship']

    # Filter configuration
    filterset_fields = ['employee', 'is_primary', 'relationship']

    # Ordering configuration
    ordering_fields = ['name', 'created_at']
    ordering = ['-is_primary', 'name']

    def get_queryset(self):
        """
        Only HR and the employee themselves can view emergency contacts.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admins see all
        if user.is_staff or user.is_superuser:
            return queryset

        # HR sees all
        if hasattr(user, 'employee_profile'):
            if user.employee_profile.role in ['hr_manager', 'hr_employee']:
                return queryset

            # Regular employees only see their own contacts
            return queryset.filter(employee__user=user)

        return queryset.none()


class EmployeeTaxViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee Tax Information.
    Restricted to HR staff only.

    Filters:
    - employee: Filter by employee ID
    - disability_exemption: Filter by disability exemption status
    """
    queryset = EmployeeTax.objects.select_related('employee', 'employee__user')
    serializer_class = EmployeeTaxSerializer
    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'employee__first_name',
        'employee__last_name',
        'employee__employee_number',
        'tax_reference_number',
        'nssa_number'
    ]

    # Filter configuration
    filterset_fields = ['employee', 'disability_exemption', 'medical_aid_provider']

    # Ordering configuration
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['employee__employee_number']

    def get_queryset(self):
        """
        Only HR can view tax information.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admins see all
        if user.is_staff or user.is_superuser:
            return queryset

        # HR sees all
        if hasattr(user, 'employee_profile'):
            if user.employee_profile.role in ['hr_manager', 'hr_employee']:
                return queryset

        # No access for regular employees (sensitive tax data)
        return queryset.none()


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee Documents.
    HR and the employee can view/upload/delete documents.

    Filters:
    - employee: Filter by employee ID
    - document_type: Filter by document type
    - is_verified: Filter by verification status
    """
    queryset = EmployeeDocument.objects.select_related(
        'employee',
        'employee__user',
        'uploaded_by',
        'verified_by'
    )
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrHR]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'employee__first_name',
        'employee__last_name',
        'employee__employee_number',
        'document_type',
        'title',
        'notes'
    ]

    # Filter configuration
    filterset_fields = [
        'employee',
        'document_type',
        'is_verified'
    ]

    # Ordering configuration
    ordering_fields = ['created_at', 'expiry_date', 'document_type']
    ordering = ['-created_at']  # Latest first

    def get_queryset(self):
        """
        Only HR and the employee themselves can view documents.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admins see all
        if user.is_staff or user.is_superuser:
            return queryset

        # HR sees all
        if hasattr(user, 'employee_profile'):
            if user.employee_profile.role in ['hr_manager', 'hr_employee']:
                return queryset

            # Regular employees only see their own documents
            return queryset.filter(employee__user=user)

        return queryset.none()

    @action(detail=True, methods=['post'], url_path='verify')
    def verify_document(self, request, pk=None):
        """
        Mark a document as verified (HR only).
        POST /employee-documents/{id}/verify/
        """
        from django.utils import timezone

        document = self.get_object()
        user = request.user

        # Only HR can verify
        is_hr = (user.is_staff or user.is_superuser or
                (hasattr(user, 'employee_profile') and
                 user.employee_profile.role in ['hr_manager', 'hr_employee']))

        if not is_hr:
            return Response(
                {'detail': 'Only HR staff can verify documents.'},
                status=status.HTTP_403_FORBIDDEN
            )

        document.is_verified = True
        document.verified_by = user
        document.verified_at = timezone.now()
        document.save()

        serializer = self.get_serializer(document)
        return Response(serializer.data)
