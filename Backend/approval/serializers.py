from rest_framework import serializers
from .models import ApprovalWorkflow, ApprovalRequest, ApprovalStep


class ApprovalWorkflowSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalWorkflow model"""

    class Meta:
        model = ApprovalWorkflow
        fields = '__all__'


class ApprovalRequestSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalRequest model"""

    class Meta:
        model = ApprovalRequest
        fields = '__all__'


class ApprovalStepSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalStep model"""

    class Meta:
        model = ApprovalStep
        fields = '__all__'

