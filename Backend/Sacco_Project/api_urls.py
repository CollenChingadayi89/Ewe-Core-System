"""
API URL Configuration for Women Excel SACCO
Includes all REST API endpoints and JWT authentication
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

# Import authentication views
from accounts.views import (
    CustomTokenObtainPairView,
    CurrentUserView,
    RegisterUserView,
    ChangePasswordView,
    UserDetailView
)

# Import all viewsets
from hr_department.views import DepartmentViewSet, DesignationViewSet
from hr_employee.views import (
    EmployeeViewSet, EmployeeSalaryViewSet, EmployeeBankDetailsViewSet,
    EmployeeEmergencyContactViewSet, EmployeeTaxViewSet, EmployeeDocumentViewSet
)
from hr_leave.views import (
    LeavePolicyViewSet, LeaveTransactionViewSet, LeaveRequestViewSet,
    PublicHolidayViewSet, WorkingHoursViewSet,
    LeaveYearConfigViewSet, LeaveNotificationSettingsViewSet, LeaveCalendarSettingsViewSet
)
from hr_attendance.views import AttendanceViewSet
from sacco_member.views import MemberViewSet
from finance_receivable.views import ReceivableViewSet, ReceivablePaymentViewSet
from finance_payable.views import VendorViewSet, PayableViewSet
from finance_expense.views import ExpenseViewSet
from finance_petty_cash.views import PettyCashViewSet
from finance_procurement.views import ProcurementRequestViewSet, ProcurementRecordViewSet
from asset.views import AssetViewSet
from vehicle.views import VehicleViewSet
from document.views import DocumentCategoryViewSet, DocumentViewSet
from onboarding.views import OnboardingViewSet
from notification.views import NotificationViewSet
from approval.views import (
    ApprovalGroupViewSet,
    ApprovalWorkflowViewSet,
    ApprovalRequestViewSet,
    ApprovalStepViewSet,
    NotificationViewSet as ApprovalNotificationViewSet
)
from approval.finance_settings_views import (
    FinanceApprovalGroupViewSet,
    FinanceWorkflowViewSet
)
from crm.views import (
    ClientViewSet,
    CompanyViewSet,
    ContactViewSet,
    DealViewSet,
    ProjectViewSet,
    TicketViewSet
)
from finance_document.views import (
    InvoiceViewSet,
    EstimateViewSet,
    PaymentViewSet
)

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
router.register(r'employee-documents', EmployeeDocumentViewSet, basename='employee-document')  # Document management

# HR - Leave
router.register(r'leave-policies', LeavePolicyViewSet, basename='leave-policy')
router.register(r'leave-transactions', LeaveTransactionViewSet, basename='leave-transaction')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leave-request')
router.register(r'public-holidays', PublicHolidayViewSet, basename='public-holiday')
router.register(r'working-hours', WorkingHoursViewSet, basename='working-hours')

# HR - Leave Configuration (Singleton endpoints)
router.register(r'leave-year-config', LeaveYearConfigViewSet, basename='leave-year-config')
router.register(r'leave-notification-settings', LeaveNotificationSettingsViewSet, basename='leave-notification-settings')
router.register(r'leave-calendar-settings', LeaveCalendarSettingsViewSet, basename='leave-calendar-settings')

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
router.register(r'procurement-records', ProcurementRecordViewSet, basename='procurement-record')

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

router.register(r'approval-groups', ApprovalGroupViewSet, basename='approval-group')
router.register(r'approval-workflows', ApprovalWorkflowViewSet, basename='approval-workflow')
router.register(r'approval-requests', ApprovalRequestViewSet, basename='approval-request')
router.register(r'approval-steps', ApprovalStepViewSet, basename='approval-step')
router.register(r'approval-notifications', ApprovalNotificationViewSet, basename='approval-notification')

# ============================================================================
# FINANCE SETTINGS ENDPOINTS (Approval Groups & Workflows for Finance)
# ============================================================================

router.register(r'finance-approval-groups', FinanceApprovalGroupViewSet, basename='finance-approval-group')
router.register(r'finance-workflows', FinanceWorkflowViewSet, basename='finance-workflow')

# ============================================================================
# CRM ENDPOINTS
# ============================================================================

router.register(r'clients', ClientViewSet, basename='client')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'deals', DealViewSet, basename='deal')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tickets', TicketViewSet, basename='ticket')

# ============================================================================
# FINANCE DOCUMENT ENDPOINTS
# ============================================================================

router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'estimates', EstimateViewSet, basename='estimate')
router.register(r'payments', PaymentViewSet, basename='payment')

# ============================================================================
# URL PATTERNS
# ============================================================================

urlpatterns = [
    # ============================================================================
    # AUTHENTICATION ENDPOINTS
    # ============================================================================

    # JWT Token Management
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # User Management
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('auth/register/', RegisterUserView.as_view(), name='register_user'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/users/<uuid:pk>/', UserDetailView.as_view(), name='user_detail'),

    # ============================================================================
    # REST API ROUTES
    # ============================================================================

    # Include all API routes from router
    path('', include(router.urls)),
]
