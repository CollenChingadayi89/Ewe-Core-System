from rest_framework import serializers
from .models import ProcurementRequest


class ProcurementRequestSerializer(serializers.ModelSerializer):
    """Serializer for ProcurementRequest model"""

    class Meta:
        model = ProcurementRequest
        fields = '__all__'

