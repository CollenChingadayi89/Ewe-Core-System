from rest_framework import serializers
from .models import PettyCash


class PettyCashSerializer(serializers.ModelSerializer):
    """Serializer for PettyCash model"""

    class Meta:
        model = PettyCash
        fields = '__all__'

