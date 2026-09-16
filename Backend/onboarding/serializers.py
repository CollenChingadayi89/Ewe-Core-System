from rest_framework import serializers
from .models import Onboarding


class OnboardingSerializer(serializers.ModelSerializer):
    """Serializer for Onboarding model"""

    class Meta:
        model = Onboarding
        fields = '__all__'

