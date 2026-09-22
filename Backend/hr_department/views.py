"""
HR Department ViewSets
Provides API endpoints for departments and designations with filtering and search.
"""

from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Department, Designation
from .serializers import (
    DepartmentListSerializer,
    DepartmentDetailSerializer,
    DepartmentSerializer,
    DesignationListSerializer,
    DesignationDetailSerializer,
    DesignationSerializer,
)
from accounts.permissions import IsHROrReadOnly


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Department management.

    List/Retrieve: Returns departments with nested manager and sub-department info
    Create/Update: Accepts department data with manager and parent references

    Filters:
    - is_active: Filter by active status
    - parent_department: Filter by parent department
    - Search: code, name, description
    - Ordering: code, name, employee_count, created_at
    """
    queryset = Department.objects.select_related(
        'manager',
        'manager__user',
        'parent_department'
    ).prefetch_related('sub_departments', 'designations')

    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = ['code', 'name', 'description']

    # Filter configuration
    filterset_fields = ['is_active', 'parent_department']

    # Ordering configuration
    ordering_fields = ['code', 'name', 'employee_count', 'created_at']
    ordering = ['code']  # Default ordering

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return DepartmentListSerializer
        elif self.action == 'retrieve':
            return DepartmentDetailSerializer
        return DepartmentSerializer

    def get_queryset(self):
        """Optimize queryset based on action"""
        queryset = super().get_queryset()

        # For list view, we don't need all the prefetch
        if self.action == 'list':
            return queryset.select_related('manager', 'parent_department')

        return queryset


class DesignationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Designation (job positions) management.

    List/Retrieve: Returns designations with department info and employee count
    Create/Update: Accepts designation data with department reference

    Filters:
    - is_active: Filter by active status
    - department: Filter by department
    - level: Filter by job level
    - grade: Filter by pay grade
    - Search: code, title, level, grade
    - Ordering: code, title, level, created_at
    """
    queryset = Designation.objects.select_related('department').prefetch_related('employees')

    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = ['code', 'title', 'level', 'grade']

    # Filter configuration
    filterset_fields = ['is_active', 'department', 'level', 'grade']

    # Ordering configuration
    ordering_fields = ['code', 'title', 'level', 'grade', 'created_at']
    ordering = ['department', 'title']  # Default ordering

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return DesignationListSerializer
        elif self.action == 'retrieve':
            return DesignationDetailSerializer
        return DesignationSerializer

    def get_queryset(self):
        """Optimize queryset based on action"""
        queryset = super().get_queryset()

        # For list view, select_related is enough
        if self.action == 'list':
            return queryset.select_related('department')

        return queryset
