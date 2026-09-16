from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Receivable, ReceivablePayment
from .serializers import ReceivableSerializer, ReceivablePaymentSerializer


class ReceivableViewSet(viewsets.ModelViewSet):
    """ViewSet for Receivable model"""
    queryset = Receivable.objects.all()
    serializer_class = ReceivableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']


class ReceivablePaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for ReceivablePayment model"""
    queryset = ReceivablePayment.objects.all()
    serializer_class = ReceivablePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']

