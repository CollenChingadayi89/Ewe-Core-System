from rest_framework import serializers
from .models import Employee, EmployeeSalary, EmployeeBankDetails, EmployeeEmergencyContact, EmployeeTax


class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for Employee model"""

    class Meta:
        model = Employee
        fields = '__all__'


class EmployeeSalarySerializer(serializers.ModelSerializer):
    """Serializer for EmployeeSalary model"""

    class Meta:
        model = EmployeeSalary
        fields = '__all__'


class EmployeeBankDetailsSerializer(serializers.ModelSerializer):
    """Serializer for EmployeeBankDetails model"""

    class Meta:
        model = EmployeeBankDetails
        fields = '__all__'


class EmployeeEmergencyContactSerializer(serializers.ModelSerializer):
    """Serializer for EmployeeEmergencyContact model"""

    class Meta:
        model = EmployeeEmergencyContact
        fields = '__all__'


class EmployeeTaxSerializer(serializers.ModelSerializer):
    """Serializer for EmployeeTax model"""

    class Meta:
        model = EmployeeTax
        fields = '__all__'

