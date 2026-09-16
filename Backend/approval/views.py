from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import ApprovalWorkflow, ApprovalRequest, ApprovalStep
from .serializers import ApprovalWorkflowSerializer, ApprovalRequestSerializer, ApprovalStepSerializer


class ApprovalWorkflowViewSet(viewsets.ModelViewSet):
    """ViewSet for ApprovalWorkflow model"""
    queryset = ApprovalWorkflow.objects.all()
    serializer_class = ApprovalWorkflowSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for ApprovalRequest model"""
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']


class ApprovalStepViewSet(viewsets.ModelViewSet):
    """ViewSet for ApprovalStep model"""
    queryset = ApprovalStep.objects.all()
    serializer_class = ApprovalStepSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']

