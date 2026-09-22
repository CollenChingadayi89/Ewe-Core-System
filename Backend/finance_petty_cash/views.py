from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import PettyCash
from .serializers import PettyCashSerializer
from approval.utils import auto_create_approval_request


class PettyCashViewSet(viewsets.ModelViewSet):
    """ViewSet for PettyCash model with approval workflow integration"""
    queryset = PettyCash.objects.all()
    serializer_class = PettyCashSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['status', 'category', 'employee', 'approved_by', 'priority']
    search_fields = ['petty_cash_number', 'purpose', 'employee__first_name', 'employee__last_name']
    ordering_fields = ['request_date', 'amount', 'created_at']
    ordering = ['-request_date', '-created_at']

    def create(self, request, *args, **kwargs):
        """
        Create petty cash request and auto-create approval request.
        """
        response = super().create(request, *args, **kwargs)

        if response.status_code == status.HTTP_201_CREATED:
            petty_cash = PettyCash.objects.get(id=response.data['id'])

            # Get requester's employee profile
            try:
                requester = request.user.employee_profile
            except AttributeError:
                # If user doesn't have employee profile, skip approval creation
                return response

            # Auto-create approval request
            # Use 'petty_cash' workflow type (simple 1-stage approval)
            auto_create_approval_request(
                content_object=petty_cash,
                requester=requester,
                workflow_type='petty_cash',
                priority=petty_cash.priority if hasattr(petty_cash, 'priority') else 'medium',
                amount=float(petty_cash.amount)
            )

        return response

