from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import PettyCash
from .serializers import PettyCashSerializer


class PettyCashViewSet(viewsets.ModelViewSet):
    """ViewSet for PettyCash model"""
    queryset = PettyCash.objects.all()
    serializer_class = PettyCashSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']

