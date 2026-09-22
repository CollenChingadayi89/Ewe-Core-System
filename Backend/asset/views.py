"""
Asset Management Views
ViewSets for IT assets and equipment tracking with custom actions.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Asset
from .serializers import (
    AssetListSerializer,
    AssetDetailSerializer,
    AssetCreateUpdateSerializer,
    AssetAssignmentSerializer,
    AssetReturnSerializer,
    AssetConditionUpdateSerializer,
)
from hr_employee.models import Employee


class AssetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Asset management.

    Provides CRUD operations and custom actions for asset lifecycle management.

    Custom Actions:
    - assign: Assign asset to an employee
    - return_asset: Return asset from employee
    - mark_lost: Mark asset as lost/stolen
    - update_condition: Update asset condition and value
    - warranty_expiring: Get assets with expiring warranties
    - available_assets: Get all available (unassigned) assets
    """
    queryset = Asset.objects.select_related(
        'assigned_to',
        'assigned_to__department',
        'assigned_to__user',
        'created_by',
        'modified_by'
    ).all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'asset_number',
        'name',
        'serial_number',
        'manufacturer',
        'model',
        'location',
        'notes',
    ]

    # Filter configuration
    filterset_fields = {
        'category': ['exact'],
        'status': ['exact'],
        'condition': ['exact'],
        'assigned_to': ['exact', 'isnull'],
        'purchase_date': ['gte', 'lte', 'exact'],
        'warranty_expiry': ['gte', 'lte', 'exact'],
    }

    # Ordering configuration
    ordering_fields = [
        'asset_number',
        'name',
        'category',
        'status',
        'condition',
        'purchase_date',
        'purchase_price',
        'current_value',
        'warranty_expiry',
        'created_at',
        'updated_at',
    ]
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return AssetListSerializer
        elif self.action == 'retrieve':
            return AssetDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AssetCreateUpdateSerializer
        elif self.action == 'assign':
            return AssetAssignmentSerializer
        elif self.action == 'return_asset':
            return AssetReturnSerializer
        elif self.action == 'update_condition':
            return AssetConditionUpdateSerializer
        return AssetDetailSerializer

    def perform_create(self, serializer):
        """Set created_by when creating asset"""
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """Set modified_by when updating asset"""
        serializer.save(modified_by=self.request.user)

    # ========================================================================
    # CUSTOM ACTIONS
    # ========================================================================

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        """
        Assign asset to an employee.

        POST /assets/{id}/assign/
        Body: {
            "assigned_to": "employee_id",
            "assignment_date": "2026-09-16" (optional),
            "location": "Office 123" (optional),
            "notes": "..." (optional)
        }
        """
        asset = self.get_object()
        serializer = AssetAssignmentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check if asset is available
        if asset.status not in ['available', 'in_repair']:
            return Response(
                {'error': f'Cannot assign asset with status "{asset.status}". Asset must be available or in_repair.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get employee
        try:
            employee = Employee.objects.get(id=serializer.validated_data['assigned_to'])
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Assign asset
        asset.assigned_to = employee
        asset.assignment_date = serializer.validated_data.get('assignment_date', timezone.now().date())
        asset.location = serializer.validated_data.get('location', asset.location)
        asset.status = 'assigned'
        asset.modified_by = request.user

        if serializer.validated_data.get('notes'):
            asset.notes = f"{asset.notes}\n[{timezone.now().date()}] Assigned to {employee.first_name} {employee.last_name}: {serializer.validated_data['notes']}" if asset.notes else f"[{timezone.now().date()}] Assigned to {employee.first_name} {employee.last_name}: {serializer.validated_data['notes']}"

        asset.save()

        # Return updated asset
        response_serializer = AssetDetailSerializer(asset)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='return')
    def return_asset(self, request, pk=None):
        """
        Return asset from employee (make available).

        POST /assets/{id}/return/
        Body: {
            "return_date": "2026-09-16" (optional),
            "condition": "good" (optional),
            "notes": "..." (optional)
        }
        """
        asset = self.get_object()
        serializer = AssetReturnSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check if asset is assigned
        if asset.status != 'assigned':
            return Response(
                {'error': f'Cannot return asset with status "{asset.status}". Asset must be assigned.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Store employee name for notes
        employee_name = f"{asset.assigned_to.first_name} {asset.assigned_to.last_name}" if asset.assigned_to else "Unknown"

        # Return asset
        asset.assigned_to = None
        asset.assignment_date = None
        asset.status = 'available'

        if serializer.validated_data.get('condition'):
            asset.condition = serializer.validated_data['condition']

        asset.modified_by = request.user

        return_date = serializer.validated_data.get('return_date', timezone.now().date())
        if serializer.validated_data.get('notes'):
            asset.notes = f"{asset.notes}\n[{return_date}] Returned from {employee_name}: {serializer.validated_data['notes']}" if asset.notes else f"[{return_date}] Returned from {employee_name}: {serializer.validated_data['notes']}"
        else:
            asset.notes = f"{asset.notes}\n[{return_date}] Returned from {employee_name}" if asset.notes else f"[{return_date}] Returned from {employee_name}"

        asset.save()

        # Return updated asset
        response_serializer = AssetDetailSerializer(asset)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='mark-lost')
    def mark_lost(self, request, pk=None):
        """
        Mark asset as lost or stolen.

        POST /assets/{id}/mark-lost/
        Body: {
            "notes": "..." (optional)
        }
        """
        asset = self.get_object()

        # Update status
        asset.status = 'lost'
        asset.modified_by = request.user

        notes = request.data.get('notes', '')
        if notes:
            asset.notes = f"{asset.notes}\n[{timezone.now().date()}] Marked as lost: {notes}" if asset.notes else f"[{timezone.now().date()}] Marked as lost: {notes}"
        else:
            asset.notes = f"{asset.notes}\n[{timezone.now().date()}] Marked as lost" if asset.notes else f"[{timezone.now().date()}] Marked as lost"

        asset.save()

        # Return updated asset
        response_serializer = AssetDetailSerializer(asset)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='update-condition')
    def update_condition(self, request, pk=None):
        """
        Update asset condition and optionally current value.

        POST /assets/{id}/update-condition/
        Body: {
            "condition": "good",
            "current_value": "500.00" (optional),
            "notes": "..." (optional)
        }
        """
        asset = self.get_object()
        serializer = AssetConditionUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Update condition
        old_condition = asset.get_condition_display()
        asset.condition = serializer.validated_data['condition']

        if serializer.validated_data.get('current_value'):
            old_value = asset.current_value
            asset.current_value = serializer.validated_data['current_value']
            value_note = f" Value updated: {old_value} -> {asset.current_value}"
        else:
            value_note = ""

        asset.modified_by = request.user

        notes = serializer.validated_data.get('notes', '')
        condition_note = f"[{timezone.now().date()}] Condition updated: {old_condition} -> {asset.get_condition_display()}.{value_note}"
        if notes:
            condition_note += f" {notes}"

        asset.notes = f"{asset.notes}\n{condition_note}" if asset.notes else condition_note

        asset.save()

        # Return updated asset
        response_serializer = AssetDetailSerializer(asset)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='warranty-expiring')
    def warranty_expiring(self, request):
        """
        Get assets with warranties expiring within the next 30 days.

        GET /assets/warranty-expiring/?days=30
        """
        days = int(request.query_params.get('days', 30))
        today = timezone.now().date()
        expiry_date = today + timezone.timedelta(days=days)

        assets = self.get_queryset().filter(
            warranty_expiry__isnull=False,
            warranty_expiry__gte=today,
            warranty_expiry__lte=expiry_date
        ).order_by('warranty_expiry')

        serializer = AssetListSerializer(assets, many=True)
        return Response({
            'count': assets.count(),
            'days': days,
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='available')
    def available_assets(self, request):
        """
        Get all available (unassigned) assets.

        GET /assets/available/
        """
        assets = self.get_queryset().filter(status='available')

        # Apply filters if provided
        category = request.query_params.get('category')
        if category:
            assets = assets.filter(category=category)

        condition = request.query_params.get('condition')
        if condition:
            assets = assets.filter(condition=condition)

        serializer = AssetListSerializer(assets, many=True)
        return Response({
            'count': assets.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='my-assets')
    def my_assets(self, request):
        """
        Get assets assigned to current user's employee profile.

        GET /assets/my-assets/
        """
        # Get employee profile for current user
        if not hasattr(request.user, 'employee_profile'):
            return Response(
                {'error': 'No employee profile found for current user.'},
                status=status.HTTP_404_NOT_FOUND
            )

        employee = request.user.employee_profile
        assets = self.get_queryset().filter(assigned_to=employee)

        serializer = AssetListSerializer(assets, many=True)
        return Response({
            'count': assets.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        """
        Get asset statistics summary.

        GET /assets/statistics/
        """
        queryset = self.get_queryset()

        stats = {
            'total_assets': queryset.count(),
            'by_status': {},
            'by_category': {},
            'by_condition': {},
            'total_value': {
                'purchase_price': 0,
                'current_value': 0,
                'depreciation': 0,
            },
            'warranties': {
                'active': 0,
                'expired': 0,
                'expiring_soon': 0,
            }
        }

        # Count by status
        for status_choice in Asset._meta.get_field('status').choices:
            status_code = status_choice[0]
            count = queryset.filter(status=status_code).count()
            stats['by_status'][status_code] = {
                'count': count,
                'label': status_choice[1]
            }

        # Count by category
        for category_choice in Asset._meta.get_field('category').choices:
            category_code = category_choice[0]
            count = queryset.filter(category=category_code).count()
            stats['by_category'][category_code] = {
                'count': count,
                'label': category_choice[1]
            }

        # Count by condition
        for condition_choice in Asset._meta.get_field('condition').choices:
            condition_code = condition_choice[0]
            count = queryset.filter(condition=condition_code).count()
            stats['by_condition'][condition_code] = {
                'count': count,
                'label': condition_choice[1]
            }

        # Calculate total values
        from django.db.models import Sum
        purchase_sum = queryset.aggregate(Sum('purchase_price'))['purchase_price__sum'] or 0
        current_sum = queryset.aggregate(Sum('current_value'))['current_value__sum'] or 0

        stats['total_value']['purchase_price'] = float(purchase_sum)
        stats['total_value']['current_value'] = float(current_sum)
        stats['total_value']['depreciation'] = float(purchase_sum - current_sum)
        stats['total_value']['depreciation_percentage'] = round(
            ((purchase_sum - current_sum) / purchase_sum * 100) if purchase_sum > 0 else 0, 2
        )

        # Warranty statistics
        today = timezone.now().date()
        stats['warranties']['active'] = queryset.filter(
            warranty_expiry__isnull=False,
            warranty_expiry__gte=today
        ).count()
        stats['warranties']['expired'] = queryset.filter(
            warranty_expiry__isnull=False,
            warranty_expiry__lt=today
        ).count()
        stats['warranties']['expiring_soon'] = queryset.filter(
            warranty_expiry__isnull=False,
            warranty_expiry__gte=today,
            warranty_expiry__lte=today + timezone.timedelta(days=30)
        ).count()

        return Response(stats)
