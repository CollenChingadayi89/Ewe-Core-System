from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.files.storage import default_storage
from django.conf import settings
import os
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
        Create expense, handle file uploads, and auto-create approval request.
        """
        # Handle file uploads if present
        uploaded_files = request.FILES.getlist('attachments')
        attachment_urls = []

        if uploaded_files:
            for uploaded_file in uploaded_files:
                # Generate unique filename
                file_extension = os.path.splitext(uploaded_file.name)[1]
                file_name = f"expense_receipt_{uploaded_file.name}"
                file_path = os.path.join('expense_receipts', file_name)

                # Save file
                saved_path = default_storage.save(file_path, uploaded_file)

                # Generate URL
                file_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
                attachment_urls.append(file_url)

        # Add attachment URLs to request data
        if attachment_urls:
            # Make request.data mutable
            request_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            request_data['attachments'] = attachment_urls
            request._full_data = request_data

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

