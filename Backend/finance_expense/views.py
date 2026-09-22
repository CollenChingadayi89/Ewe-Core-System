from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Expense
from .serializers import ExpenseSerializer
from approval.utils import auto_create_approval_request


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for Expense model with approval workflow integration"""
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['status', 'category', 'employee', 'current_approver', 'priority']
    search_fields = ['expense_number', 'description', 'employee__first_name', 'employee__last_name']
    ordering_fields = ['expense_date', 'amount', 'created_at']
    ordering = ['-expense_date', '-created_at']

    def create(self, request, *args, **kwargs):
        """
        Create expense and auto-create approval request.
        """
        response = super().create(request, *args, **kwargs)

        if response.status_code == status.HTTP_201_CREATED:
            expense = Expense.objects.get(id=response.data['id'])

            # Get requester's employee profile
            try:
                requester = request.user.employee_profile
            except AttributeError:
                # If user doesn't have employee profile, skip approval creation
                return response

            # Auto-create approval request
            # Use 'expense' workflow type
            # High-value expenses (≥ ZWG 10,000) will get 3-stage workflow
            # Regular expenses get 2-stage workflow
            auto_create_approval_request(
                content_object=expense,
                requester=requester,
                workflow_type='expense',
                priority=expense.priority if hasattr(expense, 'priority') else 'medium',
                amount=float(expense.amount)  # Used for workflow selection
            )

        return response

