"""
Common validators for data integrity and security.
These validators ensure that data meets business rules and prevents invalid inputs.
"""
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
import re


# Phone Number Validators
phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
)

zimbabwe_phone_regex = RegexValidator(
    regex=r'^(\+263|0)(71|73|77|78)\d{7}$',
    message="Enter a valid Zimbabwe phone number (e.g., +263771234567 or 0771234567)"
)


# Email Validators (additional to Django's built-in)
def validate_business_email(value):
    """
    Validate that email is from a business domain (not free providers).
    For corporate SACCO use only.
    """
    free_providers = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
    ]
    domain = value.split('@')[1].lower() if '@' in value else ''
    if domain in free_providers:
        raise ValidationError(
            f"Please use a business email address. Free email providers like {domain} are not allowed."
        )


# Identification Number Validators
zimbabwe_national_id_regex = RegexValidator(
    regex=r'^\d{2}-\d{6,7}[A-Z]\d{2}$',
    message="Enter a valid Zimbabwe National ID (format: 12-345678A12)"
)

def validate_zimbabwe_national_id(value):
    """
    Validate Zimbabwe National ID format and check digit.
    Format: XX-XXXXXXAXX (e.g., 63-123456A78)
    """
    if not re.match(r'^\d{2}-\d{6,7}[A-Z]\d{2}$', value):
        raise ValidationError("Invalid Zimbabwe National ID format. Expected: XX-XXXXXXAXX")

    # Additional validation logic can be added here (check digit algorithm, etc.)
    return value


# Financial Validators
def validate_positive_decimal(value):
    """Ensure decimal value is positive."""
    if value < 0:
        raise ValidationError("Amount must be positive.")


def validate_percentage(value):
    """Ensure value is a valid percentage (0-100)."""
    if value < 0 or value > 100:
        raise ValidationError("Percentage must be between 0 and 100.")


def validate_salary_range(value):
    """Validate salary is within reasonable range for Zimbabwe."""
    min_wage = Decimal('100.00')  # Minimum wage in ZWG
    max_wage = Decimal('1000000.00')  # Maximum expected salary

    if value < min_wage:
        raise ValidationError(f"Salary cannot be less than ZWG {min_wage} (minimum wage).")
    if value > max_wage:
        raise ValidationError(f"Salary cannot exceed ZWG {max_wage}. Please verify this amount.")


# Date Validators
def validate_future_date(value):
    """Ensure date is in the future."""
    from django.utils import timezone
    if value < timezone.now().date():
        raise ValidationError("Date must be in the future.")


def validate_past_date(value):
    """Ensure date is in the past."""
    from django.utils import timezone
    if value > timezone.now().date():
        raise ValidationError("Date must be in the past.")


def validate_reasonable_date_of_birth(value):
    """Validate date of birth is reasonable (between 16 and 100 years ago)."""
    from django.utils import timezone
    from datetime import timedelta

    today = timezone.now().date()
    min_age = today - timedelta(days=365 * 100)  # 100 years ago
    max_age = today - timedelta(days=365 * 16)   # 16 years ago (minimum working age)

    if value < min_age:
        raise ValidationError("Date of birth cannot be more than 100 years ago.")
    if value > max_age:
        raise ValidationError("Employee must be at least 16 years old.")


# Text Validators
def validate_no_special_chars(value):
    """Ensure text contains only letters, numbers, spaces, and basic punctuation."""
    if not re.match(r'^[a-zA-Z0-9\s\.,\-\']+$', value):
        raise ValidationError("Only letters, numbers, spaces, and basic punctuation (. , - ') are allowed.")


def validate_alphanumeric_code(value):
    """Validate alphanumeric code (letters, numbers, hyphens only)."""
    if not re.match(r'^[A-Z0-9\-]+$', value):
        raise ValidationError("Code must contain only uppercase letters, numbers, and hyphens.")


# Employee Number Validator
employee_number_regex = RegexValidator(
    regex=r'^EMP\d{3,6}$',
    message="Employee number must be in format: EMP001, EMP1234, etc."
)


# Member Number Validator
member_number_regex = RegexValidator(
    regex=r'^WES-\d{4}-\d{3}$',
    message="Member number must be in format: WES-YYYY-XXX (e.g., WES-2024-001)"
)


# Bank Account Validators
def validate_bank_account_number(value):
    """Validate bank account number (basic format check)."""
    # Remove spaces and hyphens
    clean_value = value.replace(' ', '').replace('-', '')

    if not clean_value.isdigit():
        raise ValidationError("Bank account number must contain only digits.")

    if len(clean_value) < 8 or len(clean_value) > 17:
        raise ValidationError("Bank account number must be between 8 and 17 digits.")


# IP Address Validator
def validate_ipv4_or_ipv6(value):
    """Validate IPv4 or IPv6 address format."""
    import ipaddress
    try:
        ipaddress.ip_address(value)
    except ValueError:
        raise ValidationError("Enter a valid IPv4 or IPv6 address.")


# File Size Validator
def validate_file_size_max_5mb(value):
    """Validate uploaded file size (max 5MB)."""
    limit = 5 * 1024 * 1024  # 5MB in bytes
    if value.size > limit:
        raise ValidationError(f"File size cannot exceed 5MB. Current size: {value.size / 1024 / 1024:.2f}MB")


def validate_file_size_max_10mb(value):
    """Validate uploaded file size (max 10MB)."""
    limit = 10 * 1024 * 1024  # 10MB in bytes
    if value.size > limit:
        raise ValidationError(f"File size cannot exceed 10MB. Current size: {value.size / 1024 / 1024:.2f}MB")


# Leave Days Validator
def validate_leave_days(value):
    """Validate leave days are within reasonable range."""
    if value <= 0:
        raise ValidationError("Leave days must be greater than 0.")
    if value > 365:
        raise ValidationError("Leave days cannot exceed 365 days in a year.")


# Minimum value validators (commonly used)
min_value_zero = MinValueValidator(0, message="Value cannot be negative.")
min_value_one = MinValueValidator(1, message="Value must be at least 1.")
min_value_percentage = MinValueValidator(0, message="Percentage cannot be negative.")
max_value_percentage = MaxValueValidator(100, message="Percentage cannot exceed 100.")
