from rest_framework import serializers
from .models import Member


class MemberSerializer(serializers.ModelSerializer):
    """Serializer for Member model"""

    class Meta:
        model = Member
        fields = '__all__'

