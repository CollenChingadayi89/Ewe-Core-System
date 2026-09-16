import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password"""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Lean authentication-only user model.
    All employee profile data stored in hr_employee.Employee model.
    Uses email instead of username for authentication.

    Security Features:
    - Two-Factor Authentication (2FA/TOTP)
    - Email Verification
    - Rate Limiting (brute-force protection)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None  # Remove username field
    email = models.EmailField(unique=True, verbose_name='Email Address')
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    # Two-Factor Authentication (2FA)
    totp_secret = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        verbose_name='TOTP Secret',
        help_text='Time-based One-Time Password secret for 2FA'
    )
    is_2fa_enabled = models.BooleanField(
        default=False,
        verbose_name='2FA Enabled',
        help_text='Whether two-factor authentication is enabled for this user'
    )
    backup_codes = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Backup Codes',
        help_text='One-time backup codes for 2FA recovery'
    )
    last_2fa_verification = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Last 2FA Verification',
        help_text='Timestamp of last successful 2FA verification'
    )

    # Email Verification
    email_verified = models.BooleanField(
        default=False,
        verbose_name='Email Verified',
        help_text='Whether the user has verified their email address'
    )
    email_verification_token = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Verification Token',
        help_text='Token for email verification link'
    )
    email_verification_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Verification Email Sent',
        help_text='When the verification email was sent'
    )

    # Rate Limiting & Security
    failed_login_attempts = models.IntegerField(
        default=0,
        verbose_name='Failed Login Attempts',
        help_text='Number of consecutive failed login attempts'
    )
    last_failed_login = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Last Failed Login',
        help_text='Timestamp of last failed login attempt'
    )
    account_locked_until = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Account Locked Until',
        help_text='Account is locked until this timestamp (for brute-force protection)'
    )
    last_password_change = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Last Password Change',
        help_text='When the user last changed their password'
    )

    objects = UserManager()  # Use custom manager

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # No additional required fields beyond email

    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return email as full name (actual name stored in Employee model)"""
        return self.email

    def get_short_name(self):
        """Return email as short name"""
        return self.email

    def is_account_locked(self):
        """Check if account is currently locked due to failed login attempts"""
        from django.utils import timezone
        if self.account_locked_until and self.account_locked_until > timezone.now():
            return True
        return False

    def reset_failed_login_attempts(self):
        """Reset failed login counter after successful login"""
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.account_locked_until = None
        self.save(update_fields=['failed_login_attempts', 'last_failed_login', 'account_locked_until'])

    def increment_failed_login_attempts(self):
        """Increment failed login counter and lock account if threshold reached"""
        from django.utils import timezone
        from datetime import timedelta

        self.failed_login_attempts += 1
        self.last_failed_login = timezone.now()

        # Lock account for 30 minutes after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.account_locked_until = timezone.now() + timedelta(minutes=30)

        self.save(update_fields=['failed_login_attempts', 'last_failed_login', 'account_locked_until'])
