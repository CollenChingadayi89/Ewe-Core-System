from rest_framework import serializers
from .models import Department, Designation


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model"""

    class Meta:
        model = Department
        fields = '__all__'


class DesignationSerializer(serializers.ModelSerializer):
    """Serializer for Designation model"""

    class Meta:
        model = Designation
        fields = '__all__'

