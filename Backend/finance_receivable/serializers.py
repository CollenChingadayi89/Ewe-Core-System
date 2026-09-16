from rest_framework import serializers
from .models import Receivable, ReceivablePayment


class ReceivableSerializer(serializers.ModelSerializer):
    """Serializer for Receivable model"""

    class Meta:
        model = Receivable
        fields = '__all__'


class ReceivablePaymentSerializer(serializers.ModelSerializer):
    """Serializer for ReceivablePayment model"""

    class Meta:
        model = ReceivablePayment
        fields = '__all__'

