"""
Constants and Enums for Women Excel SACCO System.
All values must match frontend TypeScript enums exactly.
"""

# User Roles (matches frontend UserRole)
class UserRole:
    EMPLOYEE = 'employee'
    MANAGER = 'manager'
    HR_MANAGER = 'hr_manager'
    FINANCE_MANAGER = 'finance_manager'
    CEO = 'ceo'
    ADMIN = 'admin'
    
    CHOICES = [
        (EMPLOYEE, 'Employee'),
        (MANAGER, 'Manager'),
        (HR_MANAGER, 'HR Manager'),
        (FINANCE_MANAGER, 'Finance Manager'),
        (CEO, 'CEO'),
        (ADMIN, 'Admin'),
    ]


# Approval Status
class ApprovalStatus:
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'
    
    CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (CANCELLED, 'Cancelled'),
    ]


# Receivable Categories - 15 SACCO Services
class ReceivableCategory:
    EWE_CUB = 'ewe-cub'
    LOAN_0_PERCENT = 'loan-0-percent'
    LOAN_10_PERCENT = 'loan-10-percent'
    MUKANDO = 'mukando'
    STUDENT_SACCO = 'student-sacco'
    SHARE_PURCHASE = 'share-purchase'
    REGISTRATION_EWE_CUB = 'registration-ewe-cub'
    REGISTRATION_LOAN_0 = 'registration-loan-0'
    REGISTRATION_LOAN_10 = 'registration-loan-10'
    REGISTRATION_MUKANDO = 'registration-mukando'
    REGISTRATION_STUDENT = 'registration-student'
    MEMBERSHIP_FEE = 'membership-fee'
    SERVICE_CHARGE = 'service-charge'
    DIVIDEND_COLLECTION = 'dividend-collection'
    OTHER = 'other'
    
    CHOICES = [
        (EWE_CUB, 'Ewe Cub'),
        (LOAN_0_PERCENT, '0% Loan'),
        (LOAN_10_PERCENT, '10% Loan'),
        (MUKANDO, 'Mukando'),
        (STUDENT_SACCO, 'Student SACCO'),
        (SHARE_PURCHASE, 'Share Purchase'),
        (REGISTRATION_EWE_CUB, 'Registration - Ewe Cub'),
        (REGISTRATION_LOAN_0, 'Registration - 0% Loan'),
        (REGISTRATION_LOAN_10, 'Registration - 10% Loan'),
        (REGISTRATION_MUKANDO, 'Registration - Mukando'),
        (REGISTRATION_STUDENT, 'Registration - Student'),
        (MEMBERSHIP_FEE, 'Membership Fee'),
        (SERVICE_CHARGE, 'Service Charge'),
        (DIVIDEND_COLLECTION, 'Dividend Collection'),
        (OTHER, 'Other'),
    ]


# Receivable Status
class ReceivableStatus:
    DRAFT = 'draft'
    PENDING = 'pending'
    APPROVED = 'approved'
    PARTIALLY_PAID = 'partially-paid'
    PAID = 'paid'
    OVERDUE = 'overdue'
    DEFAULTED = 'defaulted'
    WRITTEN_OFF = 'written-off'
    CANCELLED = 'cancelled'
    DISPUTED = 'disputed'
    SCHEDULED = 'scheduled'
    REJECTED = 'rejected'
    
    CHOICES = [
        (DRAFT, 'Draft'),
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (PARTIALLY_PAID, 'Partially Paid'),
        (PAID, 'Paid'),
        (OVERDUE, 'Overdue'),
        (DEFAULTED, 'Defaulted'),
        (WRITTEN_OFF, 'Written Off'),
        (CANCELLED, 'Cancelled'),
        (DISPUTED, 'Disputed'),
        (SCHEDULED, 'Scheduled'),
        (REJECTED, 'Rejected'),
    ]

# Payables: who is being paid (money going OUT of the SACCO)
class PayeeType:
    VENDOR = 'vendor'
    MEMBER = 'member'

    CHOICES = [
        (VENDOR, 'Vendor / Supplier'),
        (MEMBER, 'SACCO Member'),
    ]


# Payable categories, grouped by payee type (matches frontend payables categories)
class PayableCategory:
    # Vendor / supplier bills
    UTILITIES = 'utilities'
    RENT = 'rent'
    SUPPLIES = 'supplies'
    EQUIPMENT = 'equipment'
    SERVICES = 'services'
    MAINTENANCE = 'maintenance'
    INSURANCE = 'insurance'
    TAXES = 'taxes'
    SALARIES = 'salaries'
    PROCUREMENT = 'procurement'
    OTHER = 'other'

    # Member payouts
    DIVIDEND_PAYOUT = 'dividend-payout'
    INTEREST_PAYOUT = 'interest-payout'
    SHARE_BUYBACK = 'share-buyback'
    SAVINGS_WITHDRAWAL = 'savings-withdrawal'

    VENDOR_CHOICES = [
        (UTILITIES, 'Utilities'),
        (RENT, 'Rent'),
        (SUPPLIES, 'Office Supplies'),
        (EQUIPMENT, 'Equipment'),
        (SERVICES, 'Professional Services'),
        (MAINTENANCE, 'Maintenance'),
        (INSURANCE, 'Insurance'),
        (TAXES, 'Taxes & Fees'),
        (SALARIES, 'Salaries & Wages'),
        (PROCUREMENT, 'Procurement / Supplier Contract'),
        (OTHER, 'Other'),
    ]
    MEMBER_CHOICES = [
        (DIVIDEND_PAYOUT, 'Dividend Payout'),
        (INTEREST_PAYOUT, 'Interest Payout'),
        (SHARE_BUYBACK, 'Share Sale / Buy-back'),
        (SAVINGS_WITHDRAWAL, 'Savings Withdrawal'),
    ]
    CHOICES = [
        ('Vendor / Supplier', VENDOR_CHOICES),
        ('SACCO Member', MEMBER_CHOICES),
    ]

    VENDOR_VALUES = [value for value, _ in VENDOR_CHOICES]
    MEMBER_VALUES = [value for value, _ in MEMBER_CHOICES]

    @classmethod
    def allowed_for(cls, payee_type):
        return cls.MEMBER_VALUES if payee_type == PayeeType.MEMBER else cls.VENDOR_VALUES


CURRENCY_CHOICES = [
    ('ZWG', 'ZWG - Zimbabwe Gold'),
    ('USD', 'USD - United States Dollar')
]

PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]


# Employee Status
class EmploymentStatus:
    PERMANENT = 'permanent'
    CONTRACT = 'contract'
    PROBATION = 'probation'
    INTERN = 'intern'
    TERMINATED = 'terminated'
    RESIGNED = 'resigned'

    CHOICES = [
        (PERMANENT, 'Permanent'),
        (CONTRACT, 'Contract'),
        (PROBATION, 'Probation'),
        (INTERN, 'Intern'),
        (TERMINATED, 'Terminated'),
        (RESIGNED, 'Resigned'),
    ]


# Gender
class Gender:
    MALE = 'male'
    FEMALE = 'female'
    OTHER = 'other'
    PREFER_NOT_TO_SAY = 'prefer_not_to_say'

    CHOICES = [
        (MALE, 'Male'),
        (FEMALE, 'Female'),
        (OTHER, 'Other'),
        (PREFER_NOT_TO_SAY, 'Prefer Not to Say'),
    ]


# Marital Status
class MaritalStatus:
    SINGLE = 'single'
    MARRIED = 'married'
    DIVORCED = 'divorced'
    WIDOWED = 'widowed'

    CHOICES = [
        (SINGLE, 'Single'),
        (MARRIED, 'Married'),
        (DIVORCED, 'Divorced'),
        (WIDOWED, 'Widowed'),
    ]


# Blood Group
BLOOD_GROUP_CHOICES = [
    ('A+', 'A+'),
    ('A-', 'A-'),
    ('B+', 'B+'),
    ('B-', 'B-'),
    ('AB+', 'AB+'),
    ('AB-', 'AB-'),
    ('O+', 'O+'),
    ('O-', 'O-'),
]


# Payment Frequency
class PaymentFrequency:
    WEEKLY = 'weekly'
    BIWEEKLY = 'biweekly'
    MONTHLY = 'monthly'
    QUARTERLY = 'quarterly'
    ANNUALLY = 'annually'

    CHOICES = [
        (WEEKLY, 'Weekly'),
        (BIWEEKLY, 'Bi-weekly'),
        (MONTHLY, 'Monthly'),
        (QUARTERLY, 'Quarterly'),
        (ANNUALLY, 'Annually'),
    ]


# Leave Types
class LeaveType:
    ANNUAL = 'annual'
    SICK = 'sick'
    CASUAL = 'casual'
    MATERNITY = 'maternity'
    PATERNITY = 'paternity'
    COMPASSIONATE = 'compassionate'
    UNPAID = 'unpaid'
    SPECIAL = 'special'
    STUDY = 'study'

    CHOICES = [
        (ANNUAL, 'Annual / Vacation Leave'),
        (SICK, 'Sick Leave'),
        (CASUAL, 'Casual Leave'),
        (MATERNITY, 'Maternity Leave'),
        (PATERNITY, 'Paternity Leave'),
        (COMPASSIONATE, 'Compassionate Leave'),
        (UNPAID, 'Unpaid Leave'),
        (SPECIAL, 'Special Leave'),
        (STUDY, 'Study Leave'),
    ]


# Leave Transaction Types
class LeaveTransactionType:
    ACCRUAL = 'accrual'
    USAGE = 'usage'
    APPROVAL_RESERVATION = 'approval_reservation'
    CANCELLATION_REVERSAL = 'cancellation_reversal'
    ADJUSTMENT = 'adjustment'
    CARRYFORWARD = 'carryforward'

    CHOICES = [
        (ACCRUAL, 'Accrual'),
        (USAGE, 'Usage'),
        (APPROVAL_RESERVATION, 'Approval Reservation'),
        (CANCELLATION_REVERSAL, 'Cancellation Reversal'),
        (ADJUSTMENT, 'Adjustment'),
        (CARRYFORWARD, 'Carryforward'),
    ]


# Leave Request Status
class LeaveRequestStatus:
    DRAFT = 'draft'
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'
    COMPLETED = 'completed'

    CHOICES = [
        (DRAFT, 'Draft'),
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (CANCELLED, 'Cancelled'),
        (COMPLETED, 'Completed'),
    ]


# Accrual Methods
class AccrualMethod:
    NONE = 'none'
    MONTHLY = 'monthly'
    QUARTERLY = 'quarterly'
    ANNUALLY = 'annually'
    ON_JOINING = 'on-joining'

    CHOICES = [
        (NONE, 'None (Fixed Entitlement)'),
        (MONTHLY, 'Monthly'),
        (QUARTERLY, 'Quarterly'),
        (ANNUALLY, 'Annually'),
        (ON_JOINING, 'On Joining'),
    ]


# Leave Pay Status
class LeavePayStatus:
    FULL_PAY = 'full-pay'
    HALF_PAY = 'half-pay'
    NO_PAY = 'no-pay'

    CHOICES = [
        (FULL_PAY, 'Full Pay'),
        (HALF_PAY, 'Half Pay'),
        (NO_PAY, 'No Pay'),
    ]
