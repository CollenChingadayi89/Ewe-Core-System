from rest_framework import serializers
from .models import Asset


class AssetSerializer(serializers.ModelSerializer):
    """Serializer for Asset model"""

    class Meta:
        model = Asset
        fields = '__all__'

