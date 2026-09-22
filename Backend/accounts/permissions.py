"""
Custom permissions for the Women Excel SACCO system.
Implements role-based access control and object-level permissions.
"""

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Users can view any object, but can only edit their own.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        # Assumes the model has a 'user' field
        if hasattr(obj, 'user'):
            return obj.user == request.user

        # For User model itself
        if hasattr(obj, 'id') and obj.__class__.__name__ == 'User':
            return obj == request.user

        return False


class IsHROrReadOnly(permissions.BasePermission):
    """
    Allows HR staff to edit employee data, others can only read.
    Requires user to have an employee_profile with role='hr_manager' or 'hr_employee'.
    """

    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions only for HR staff
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers always have access
        if request.user.is_superuser or request.user.is_staff:
            return True

        # Check if user has employee profile with HR role
        if hasattr(request.user, 'employee_profile'):
            employee = request.user.employee_profile
            return employee.role in ['hr_manager', 'hr_employee']

        return False


class IsFinanceOrReadOnly(permissions.BasePermission):
    """
    Allows Finance staff to edit financial data, others can only read.
    """

    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions only for Finance staff
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers always have access
        if request.user.is_superuser or request.user.is_staff:
            return True

        # Check if user has employee profile with Finance role
        if hasattr(request.user, 'employee_profile'):
            employee = request.user.employee_profile
            return employee.role in ['finance_manager', 'finance_employee']

        return False


class IsOwnerOrHR(permissions.BasePermission):
    """
    Allows users to access their own data, or HR to access any employee data.
    Useful for employee profile endpoints where users should see their own data
    but HR should see all.
    """

    def has_object_permission(self, request, view, obj):
        # Superusers always have access
        if request.user.is_superuser or request.user.is_staff:
            return True

        # Check if user has employee profile with HR role
        is_hr = False
        if hasattr(request.user, 'employee_profile'):
            employee = request.user.employee_profile
            is_hr = employee.role in ['hr_manager', 'hr_employee']

        # HR can access any object
        if is_hr:
            return True

        # Otherwise, only allow access to own data
        if hasattr(obj, 'user'):
            return obj.user == request.user

        # For User model itself
        if obj.__class__.__name__ == 'User':
            return obj == request.user

        # For Employee model
        if obj.__class__.__name__ == 'Employee':
            return obj.user == request.user

        return False


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users (staff or superuser).
    """

    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))


class CanApprove(permissions.BasePermission):
    """
    Permission for approval actions.
    Users can only approve requests where they are in the approval chain.
    """

    def has_object_permission(self, request, view, obj):
        # Superusers can approve anything
        if request.user.is_superuser:
            return True

        # Check if the user is a valid approver for this request
        # This assumes the object has an approval_request or similar field
        if hasattr(obj, 'current_approver_id'):
            return str(obj.current_approver_id) == str(request.user.id)

        if hasattr(obj, 'approval_chain'):
            # Check if user is in the approval chain
            approver_ids = [step.get('approver_id') for step in obj.approval_chain]
            return str(request.user.id) in approver_ids

        return False
