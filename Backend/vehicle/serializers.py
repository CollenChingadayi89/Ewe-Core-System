from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    """Serializer for Vehicle model"""

    class Meta:
        model = Vehicle
        fields = '__all__'

