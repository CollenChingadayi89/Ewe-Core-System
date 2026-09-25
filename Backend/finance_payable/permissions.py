"""
Payable permissions.

Anyone can raise a payable; approving and paying follow the approval workflow
(see services.py), so they are not role-based.
"""
from rest_framework import permissions


def get_employee(user):
    """The Employee profile of a user, or None."""
    return getattr(user, 'employee_profile', None)


class PayablePermission(permissions.BasePermission):
    """
    - Read / create: any authenticated user (the queryset limits what they can see).
    - Update / delete: the submitter or staff, and only while the payable is still editable
      (checked in the view, since it depends on workflow state).
    - mark_paid: decided by the workflow in services.record_payment.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS or view.action == 'mark_paid':
            return True
        if request.user.is_staff or request.user.is_superuser:
            return True
        employee = get_employee(request.user)
        return employee is not None and obj.submitted_by_id == employee.id
