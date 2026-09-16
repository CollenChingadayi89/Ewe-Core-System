from rest_framework import serializers
from .models import LeavePolicy, LeaveTransaction, LeaveRequest, PublicHoliday, WorkingHours


class LeavePolicySerializer(serializers.ModelSerializer):
    """Serializer for LeavePolicy model"""

    class Meta:
        model = LeavePolicy
        fields = '__all__'


class LeaveTransactionSerializer(serializers.ModelSerializer):
    """Serializer for LeaveTransaction model"""

    class Meta:
        model = LeaveTransaction
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    """Serializer for LeaveRequest model"""

    class Meta:
        model = LeaveRequest
        fields = '__all__'


class PublicHolidaySerializer(serializers.ModelSerializer):
    """Serializer for PublicHoliday model"""

    class Meta:
        model = PublicHoliday
        fields = '__all__'


class WorkingHoursSerializer(serializers.ModelSerializer):
    """Serializer for WorkingHours model"""

    class Meta:
        model = WorkingHours
        fields = '__all__'

