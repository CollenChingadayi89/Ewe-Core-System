"""
Asset Management Serializers
Professional serializers for IT assets and equipment tracking.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Asset


# ============================================================================
# ASSET SERIALIZERS
# ============================================================================

class AssetListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for asset lists.
    Includes essential fields and computed values.
    """
    assigned_to_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    is_warranty_expired = serializers.SerializerMethodField()
    days_since_purchase = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'id',
            'asset_number',
            'name',
            'category',
            'category_display',
            'serial_number',
            'manufacturer',
            'model',
            'status',
            'status_display',
            'condition',
            'condition_display',
            'assigned_to',
            'assigned_to_name',
            'location',
            'purchase_date',
            'purchase_price',
            'current_value',
            'warranty_expiry',
            'is_warranty_expired',
            'days_since_purchase',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        """Get assigned employee name"""
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"
        return None

    def get_is_warranty_expired(self, obj):
        """Check if warranty is expired"""
        if obj.warranty_expiry:
            return obj.warranty_expiry < timezone.now().date()
        return None

    def get_days_since_purchase(self, obj):
        """Calculate days since purchase"""
        if obj.purchase_date:
            delta = timezone.now().date() - obj.purchase_date
            return delta.days
        return None


class AssetDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for single asset retrieval.
    Includes all fields and nested relationships.
    """
    assigned_to_details = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)

    # Computed fields
    is_warranty_expired = serializers.SerializerMethodField()
    days_since_purchase = serializers.SerializerMethodField()
    days_since_assignment = serializers.SerializerMethodField()
    warranty_days_remaining = serializers.SerializerMethodField()
    asset_age_years = serializers.SerializerMethodField()
    depreciation_percentage = serializers.SerializerMethodField()

    # Audit fields
    created_by_name = serializers.SerializerMethodField()
    modified_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'modified_by']

    def get_assigned_to_details(self, obj):
        """Get full assigned employee details"""
        if obj.assigned_to:
            return {
                'id': str(obj.assigned_to.id),
                'employee_number': obj.assigned_to.employee_number,
                'first_name': obj.assigned_to.first_name,
                'last_name': obj.assigned_to.last_name,
                'full_name': f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}",
                'email': obj.assigned_to.user.email if obj.assigned_to.user else None,
                'department': obj.assigned_to.department.name if obj.assigned_to.department else None,
            }
        return None

    def get_is_warranty_expired(self, obj):
        """Check if warranty is expired"""
        if obj.warranty_expiry:
            return obj.warranty_expiry < timezone.now().date()
        return None

    def get_days_since_purchase(self, obj):
        """Calculate days since purchase"""
        if obj.purchase_date:
            delta = timezone.now().date() - obj.purchase_date
            return delta.days
        return None

    def get_days_since_assignment(self, obj):
        """Calculate days since assignment"""
        if obj.assignment_date:
            delta = timezone.now().date() - obj.assignment_date
            return delta.days
        return None

    def get_warranty_days_remaining(self, obj):
        """Calculate warranty days remaining"""
        if obj.warranty_expiry:
            delta = obj.warranty_expiry - timezone.now().date()
            return delta.days if delta.days > 0 else 0
        return None

    def get_asset_age_years(self, obj):
        """Calculate asset age in years"""
        if obj.purchase_date:
            delta = timezone.now().date() - obj.purchase_date
            return round(delta.days / 365.25, 1)
        return None

    def get_depreciation_percentage(self, obj):
        """Calculate depreciation percentage"""
        if obj.purchase_price and obj.current_value:
            if obj.purchase_price > 0:
                depreciation = ((obj.purchase_price - obj.current_value) / obj.purchase_price) * 100
                return round(depreciation, 2)
        return None

    def get_created_by_name(self, obj):
        """Get created by user name"""
        if obj.created_by and hasattr(obj.created_by, 'employee_profile'):
            emp = obj.created_by.employee_profile
            return f"{emp.first_name} {emp.last_name}"
        return None

    def get_modified_by_name(self, obj):
        """Get modified by user name"""
        if obj.modified_by and hasattr(obj.modified_by, 'employee_profile'):
            emp = obj.modified_by.employee_profile
            return f"{emp.first_name} {emp.last_name}"
        return None


class AssetCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating assets.
    Includes comprehensive validation logic.
    """

    class Meta:
        model = Asset
        fields = [
            'asset_number',
            'name',
            'category',
            'description',
            'serial_number',
            'manufacturer',
            'model',
            'purchase_date',
            'purchase_price',
            'supplier',
            'current_value',
            'condition',
            'status',
            'assigned_to',
            'assignment_date',
            'location',
            'warranty_expiry',
            'notes',
        ]

    def validate_asset_number(self, value):
        """Validate asset number uniqueness"""
        instance = self.instance
        if instance:
            # Update - exclude current instance
            if Asset.objects.exclude(pk=instance.pk).filter(asset_number=value).exists():
                raise serializers.ValidationError("Asset with this asset number already exists.")
        else:
            # Create - check if exists
            if Asset.objects.filter(asset_number=value).exists():
                raise serializers.ValidationError("Asset with this asset number already exists.")
        return value

    def validate_serial_number(self, value):
        """Validate serial number uniqueness if provided"""
        if value:
            instance = self.instance
            if instance:
                if Asset.objects.exclude(pk=instance.pk).filter(serial_number=value).exists():
                    raise serializers.ValidationError("Asset with this serial number already exists.")
            else:
                if Asset.objects.filter(serial_number=value).exists():
                    raise serializers.ValidationError("Asset with this serial number already exists.")
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Validate purchase price and current value
        purchase_price = data.get('purchase_price')
        current_value = data.get('current_value')

        if purchase_price and current_value:
            if current_value > purchase_price:
                raise serializers.ValidationError({
                    'current_value': 'Current value cannot exceed purchase price.'
                })

        # Validate assignment
        status = data.get('status')
        assigned_to = data.get('assigned_to')

        if status == 'assigned' and not assigned_to:
            raise serializers.ValidationError({
                'assigned_to': 'Assigned employee is required when status is "assigned".'
            })

        if assigned_to and status not in ['assigned']:
            raise serializers.ValidationError({
                'status': 'Status must be "assigned" when employee is assigned.'
            })

        # Validate assignment date
        assignment_date = data.get('assignment_date')
        if assigned_to and not assignment_date:
            data['assignment_date'] = timezone.now().date()

        # Validate warranty expiry
        warranty_expiry = data.get('warranty_expiry')
        purchase_date = data.get('purchase_date', getattr(self.instance, 'purchase_date', None))

        if warranty_expiry and purchase_date:
            if warranty_expiry < purchase_date:
                raise serializers.ValidationError({
                    'warranty_expiry': 'Warranty expiry date cannot be before purchase date.'
                })

        return data


class AssetAssignmentSerializer(serializers.Serializer):
    """Serializer for assigning asset to employee"""
    assigned_to = serializers.UUIDField(required=True)
    assignment_date = serializers.DateField(required=False)
    location = serializers.CharField(max_length=200, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_assignment_date(self, value):
        """Validate assignment date is not in the future"""
        if value > timezone.now().date():
            raise serializers.ValidationError("Assignment date cannot be in the future.")
        return value


class AssetReturnSerializer(serializers.Serializer):
    """Serializer for returning asset from employee"""
    return_date = serializers.DateField(required=False)
    condition = serializers.ChoiceField(
        choices=['new', 'good', 'fair', 'poor', 'damaged'],
        required=False
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class AssetConditionUpdateSerializer(serializers.Serializer):
    """Serializer for updating asset condition"""
    condition = serializers.ChoiceField(
        choices=['new', 'good', 'fair', 'poor', 'damaged'],
        required=True
    )
    current_value = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        min_value=0
    )
    notes = serializers.CharField(required=False, allow_blank=True)
