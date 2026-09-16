from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model"""

    class Meta:
        model = Attendance
        fields = '__all__'

