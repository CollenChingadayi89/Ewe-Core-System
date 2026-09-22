from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import ProcurementRequest
from .serializers import ProcurementRequestSerializer
from approval.utils import auto_create_approval_request


class ProcurementRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for ProcurementRequest model with approval workflow integration"""
    queryset = ProcurementRequest.objects.all()
    serializer_class = ProcurementRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['status', 'category', 'requested_by', 'current_approver', 'priority', 'vendor']
    search_fields = ['request_number', 'item_description', 'requested_by__first_name', 'requested_by__last_name']
    ordering_fields = ['request_date', 'total_amount', 'required_by_date', 'created_at']
    ordering = ['-request_date', '-created_at']

    def create(self, request, *args, **kwargs):
        """
        Create procurement request and auto-create approval request.
        """
        response = super().create(request, *args, **kwargs)

        if response.status_code == status.HTTP_201_CREATED:
            procurement = ProcurementRequest.objects.get(id=response.data['id'])

            # Get requester's employee profile
            try:
                requester = request.user.employee_profile
            except AttributeError:
                # If user doesn't have employee profile, skip approval creation
                return response

            # Auto-create approval request
            # Use 'procurement' workflow type (2-stage: manager + finance)
            auto_create_approval_request(
                content_object=procurement,
                requester=requester,
                workflow_type='procurement',
                priority=procurement.priority if hasattr(procurement, 'priority') else 'medium',
                amount=float(procurement.total_amount)
            )

        return response

