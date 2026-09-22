from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User


class EmployeeProfileSerializer(serializers.Serializer):
    """
    Nested serializer for employee profile data.
    Read-only, used within UserSerializer.
    """
    id = serializers.UUIDField(read_only=True)
    employee_number = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    avatar = serializers.ImageField(read_only=True)
    department_id = serializers.UUIDField(read_only=True, source='department.id')
    department_name = serializers.CharField(read_only=True, source='department.name')
    designation_id = serializers.UUIDField(read_only=True, source='designation.id')
    designation_name = serializers.CharField(read_only=True, source='designation.title')
    role = serializers.CharField(read_only=True)
    employment_status = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)


class UserSerializer(serializers.ModelSerializer):
    """
    Comprehensive user serializer with nested employee profile.
    Returns user authentication data + employee information.
    """
    employee_profile = EmployeeProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'is_active',
            'is_staff',
            'is_superuser',
            'email_verified',
            'is_2fa_enabled',
            'date_joined',
            'last_login',
            'employee_profile'
        ]
        read_only_fields = [
            'id',
            'date_joined',
            'last_login',
            'email_verified',
            'is_2fa_enabled'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users (admin-only).
    Validates password strength and email uniqueness.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm']

    def validate_email(self, value):
        """Ensure email is unique (case-insensitive)"""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        """Validate password confirmation match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password_confirm": "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        """Create user with validated data"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint.
    Validates old password and enforces password strength requirements.
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        """Validate that old password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        """Validate new password strength using Django validators"""
        user = self.context['request'].user
        try:
            validate_password(value, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """Validate password confirmation match"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password_confirm": "Password fields didn't match."
            })

        # Ensure new password is different from old password
        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError({
                "new_password": "New password must be different from old password."
            })

        return attrs

    def save(self, **kwargs):
        """Change the user's password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])

        # Update last_password_change timestamp
        from django.utils import timezone
        user.last_password_change = timezone.now()

        user.save()
        return user
