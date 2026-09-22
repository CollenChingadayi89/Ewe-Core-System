"""
Authentication views for Women Excel SACCO system.
Handles user authentication, profile management, and password operations.
"""

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from django.utils import timezone

from .models import User
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    ChangePasswordSerializer
)
from .permissions import IsAdminUser


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer with account lock checking and better error messages.
    Uses email instead of username for authentication.
    """
    username_field = User.USERNAME_FIELD  # Use model's USERNAME_FIELD

    def validate(self, attrs):
        """Validate credentials and check account status"""
        from rest_framework_simplejwt.exceptions import AuthenticationFailed
        from django.contrib.auth import authenticate

        email = attrs.get(self.username_field)
        password = attrs.get('password')

        if not email or not password:
            raise AuthenticationFailed('Email and password are required.')

        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists or not for security
            raise AuthenticationFailed('Invalid email or password.')

        # Check if account is locked
        if user.is_account_locked():
            lock_time = (user.account_locked_until - timezone.now()).seconds // 60
            raise AuthenticationFailed(
                f'Account is locked due to too many failed login attempts. '
                f'Try again in {lock_time} minutes.'
            )

        # Check if account is active
        if not user.is_active:
            raise AuthenticationFailed('This account has been deactivated.')

        # Check password
        if not user.check_password(password):
            # Password is incorrect - increment failed login attempts
            user.increment_failed_login_attempts()
            raise AuthenticationFailed('Invalid email or password.')

        # Password is correct - reset failed login attempts
        user.reset_failed_login_attempts()

        # Generate tokens using parent class
        refresh = self.get_token(user)

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view with enhanced security features:
    - Account lock checking
    - Failed login attempt tracking
    - Better error messages
    """
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Returns the current authenticated user with employee profile.
    Uses select_related for optimized query.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Optimize query with select_related to avoid N+1
        user = User.objects.select_related(
            'employee_profile',
            'employee_profile__department',
            'employee_profile__designation'
        ).get(pk=request.user.pk)

        serializer = UserSerializer(user)
        return Response(serializer.data)


class RegisterUserView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Create a new user account (admin-only).
    After user is created, admin should create corresponding Employee profile.
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        """Create user and set initial status"""
        user = serializer.save()

        # Send email verification (in production)
        # For now, we'll log to console
        # TODO: Implement email verification in production
        print(f"User created: {user.email}")

        return user

    def create(self, request, *args, **kwargs):
        """Override to return custom response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.perform_create(serializer)

        # Return the created user with full profile
        user_serializer = UserSerializer(user)

        return Response(
            {
                'message': 'User created successfully. Please create employee profile.',
                'user': user_serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Change password for the current authenticated user.
    Requires old password for security.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            # Save will change the password
            serializer.save()

            return Response(
                {'message': 'Password changed successfully.'},
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/auth/users/{id}/
    Retrieve or update user details.
    Users can only update their own profile, admins can update any.
    """
    queryset = User.objects.select_related(
        'employee_profile',
        'employee_profile__department',
        'employee_profile__designation'
    )
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter queryset based on permissions"""
        user = self.request.user

        # Admins see all users
        if user.is_staff or user.is_superuser:
            return self.queryset.all()

        # Regular users only see themselves
        return self.queryset.filter(id=user.id)

    def update(self, request, *args, **kwargs):
        """
        Allow users to update only specific fields.
        Admins can update all fields.
        """
        instance = self.get_object()

        # Only admin can update is_active, is_staff, is_superuser
        if not (request.user.is_staff or request.user.is_superuser):
            # Remove protected fields from request data
            protected_fields = ['is_active', 'is_staff', 'is_superuser', 'email']
            for field in protected_fields:
                request.data.pop(field, None)

        return super().update(request, *args, **kwargs)
