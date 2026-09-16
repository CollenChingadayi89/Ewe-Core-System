from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model"""

    class Meta:
        model = Expense
        fields = '__all__'

