from rest_framework import serializers
from .models import Vendor, Payable


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor model"""

    class Meta:
        model = Vendor
        fields = '__all__'


class PayableSerializer(serializers.ModelSerializer):
    """Serializer for Payable model"""

    class Meta:
        model = Payable
        fields = '__all__'

