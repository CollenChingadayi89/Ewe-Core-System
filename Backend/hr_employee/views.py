from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Employee, EmployeeSalary, EmployeeBankDetails, EmployeeEmergencyContact, EmployeeTax
from .serializers import EmployeeSerializer, EmployeeSalarySerializer, EmployeeBankDetailsSerializer, EmployeeEmergencyContactSerializer, EmployeeTaxSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    """ViewSet for Employee model"""
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']


class EmployeeSalaryViewSet(viewsets.ModelViewSet):
    """ViewSet for EmployeeSalary model"""
    queryset = EmployeeSalary.objects.all()
    serializer_class = EmployeeSalarySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']


class EmployeeBankDetailsViewSet(viewsets.ModelViewSet):
    """ViewSet for EmployeeBankDetails model"""
    queryset = EmployeeBankDetails.objects.all()
    serializer_class = EmployeeBankDetailsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']


class EmployeeEmergencyContactViewSet(viewsets.ModelViewSet):
    """ViewSet for EmployeeEmergencyContact model"""
    queryset = EmployeeEmergencyContact.objects.all()
    serializer_class = EmployeeEmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']


class EmployeeTaxViewSet(viewsets.ModelViewSet):
    """ViewSet for EmployeeTax model"""
    queryset = EmployeeTax.objects.all()
    serializer_class = EmployeeTaxSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Add search fields (customize per model)
    # search_fields = ['field1', 'field2']
    # filterset_fields = ['field1', 'field2']
    # ordering_fields = ['created_at', 'updated_at']

