from rest_framework import serializers
from .models import Member


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer for Member model.
    member_number and join_date are optional on create: the view assigns the next
    WES-YYYY-### number and today's date when they are not supplied.
    """

    class Meta:
        model = Member
        fields = '__all__'
        extra_kwargs = {
            'member_number': {'required': False},
            'join_date': {'required': False},
        }


class MemberLookupSerializer(serializers.ModelSerializer):
    """Minimal member data for pickers (e.g. choosing a payee); no IDs or balances."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = Member
        fields = ['id', 'member_number', 'full_name', 'phone', 'account_status']

