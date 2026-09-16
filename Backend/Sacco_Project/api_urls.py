"""
API URL Configuration for Women Excel SACCO
Includes all REST API endpoints and JWT authentication
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

# Import all viewsets
from hr_department.views import DepartmentViewSet, DesignationViewSet
from hr_employee.views import (
    EmployeeViewSet, EmployeeSalaryViewSet, EmployeeBankDetailsViewSet,
    EmployeeEmergencyContactViewSet, EmployeeTaxViewSet
)
from hr_leave.views import (
    LeavePolicyViewSet, LeaveTransactionViewSet, LeaveRequestViewSet,
    PublicHolidayViewSet, WorkingHoursViewSet
)
from hr_attendance.views import AttendanceViewSet
from sacco_member.views import MemberViewSet
from finance_receivable.views import ReceivableViewSet, ReceivablePaymentViewSet
from finance_payable.views import VendorViewSet, PayableViewSet
from finance_expense.views import ExpenseViewSet
from finance_petty_cash.views import PettyCashViewSet
from finance_procurement.views import ProcurementRequestViewSet
from asset.views import AssetViewSet
from vehicle.views import VehicleViewSet
from document.views import DocumentCategoryViewSet, DocumentViewSet
from onboarding.views import OnboardingViewSet
from notification.views import NotificationViewSet
from approval.views import ApprovalWorkflowViewSet, ApprovalRequestViewSet, ApprovalStepViewSet

# Create router
router = DefaultRouter()

# ============================================================================
# HR MANAGEMENT ENDPOINTS
# ============================================================================

# HR - Department
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'designations', DesignationViewSet, basename='designation')

# HR - Employee
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'employee-salaries', EmployeeSalaryViewSet, basename='employee-salary')
router.register(r'employee-bank-details', EmployeeBankDetailsViewSet, basename='employee-bank-details')
router.register(r'employee-emergency-contacts', EmployeeEmergencyContactViewSet, basename='employee-emergency-contact')
router.register(r'employee-tax', EmployeeTaxViewSet, basename='employee-tax')

# HR - Leave
router.register(r'leave-policies', LeavePolicyViewSet, basename='leave-policy')
router.register(r'leave-transactions', LeaveTransactionViewSet, basename='leave-transaction')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leave-request')
router.register(r'public-holidays', PublicHolidayViewSet, basename='public-holiday')
router.register(r'working-hours', WorkingHoursViewSet, basename='working-hours')

# HR - Attendance
router.register(r'attendance', AttendanceViewSet, basename='attendance')

# ============================================================================
# SACCO & FINANCE ENDPOINTS
# ============================================================================

# SACCO Members
router.register(r'members', MemberViewSet, basename='member')

# Finance - Receivable
router.register(r'receivables', ReceivableViewSet, basename='receivable')
router.register(r'receivable-payments', ReceivablePaymentViewSet, basename='receivable-payment')

# Finance - Payable
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'payables', PayableViewSet, basename='payable')

# Finance - Expense
router.register(r'expenses', ExpenseViewSet, basename='expense')

# Finance - Petty Cash
router.register(r'petty-cash', PettyCashViewSet, basename='petty-cash')

# Finance - Procurement
router.register(r'procurement-requests', ProcurementRequestViewSet, basename='procurement-request')

# ============================================================================
# ASSET MANAGEMENT ENDPOINTS
# ============================================================================

router.register(r'assets', AssetViewSet, basename='asset')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')

# ============================================================================
# DOCUMENT MANAGEMENT ENDPOINTS
# ============================================================================

router.register(r'document-categories', DocumentCategoryViewSet, basename='document-category')
router.register(r'documents', DocumentViewSet, basename='document')

# ============================================================================
# SUPPORT ENDPOINTS
# ============================================================================

router.register(r'onboarding', OnboardingViewSet, basename='onboarding')
router.register(r'notifications', NotificationViewSet, basename='notification')

# ============================================================================
# APPROVAL WORKFLOW ENDPOINTS
# ============================================================================

router.register(r'approval-workflows', ApprovalWorkflowViewSet, basename='approval-workflow')
router.register(r'approval-requests', ApprovalRequestViewSet, basename='approval-request')
router.register(r'approval-steps', ApprovalStepViewSet, basename='approval-step')

# ============================================================================
# URL PATTERNS
# ============================================================================

urlpatterns = [
    # JWT Authentication endpoints
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Include all API routes
    path('', include(router.urls)),
]
