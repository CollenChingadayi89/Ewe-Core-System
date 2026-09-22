"""
CRM Module Serializers
Handles serialization for Client, Company, Contact, Deal, Project, and Ticket models
"""

from rest_framework import serializers
from .models import Client, Company, Contact, Deal, Project, Ticket


# ============================================================================
# CLIENT SERIALIZERS
# ============================================================================

class ClientListSerializer(serializers.ModelSerializer):
    """
    Serializer for Client list view
    Includes minimal fields for performance
    """
    company_name = serializers.CharField(source='company.company_name', read_only=True, allow_null=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'client_number', 'client_type', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'company', 'company_name', 'status', 'assigned_to',
            'assigned_to_name', 'lifetime_value', 'credit_rating', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'client_number', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class ClientDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Client detail view
    Includes all fields and nested relationships
    """
    company_details = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'client_number', 'client_type', 'first_name', 'last_name', 'full_name',
            'company', 'company_details', 'position', 'email', 'phone', 'alternate_phone',
            'address', 'city', 'country', 'status', 'source', 'assigned_to',
            'assigned_to_details', 'lifetime_value', 'credit_rating', 'notes',
            'tags', 'preferences', 'last_contact_date', 'next_follow_up_date',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'client_number', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_company_details(self, obj):
        if obj.company:
            return {
                'id': obj.company.id,
                'company_number': obj.company.company_number,
                'company_name': obj.company.company_name,
                'industry': obj.company.industry,
                'company_size': obj.company.company_size,
            }
        return None

    def get_assigned_to_details(self, obj):
        if obj.assigned_to:
            return {
                'id': obj.assigned_to.id,
                'employee_number': obj.assigned_to.employee_number,
                'full_name': obj.assigned_to.full_name,
                'email': obj.assigned_to.user.email if obj.assigned_to.user else None,
            }
        return None


class ClientCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating Client
    """
    class Meta:
        model = Client
        fields = [
            'client_type', 'first_name', 'last_name', 'company', 'position',
            'email', 'phone', 'alternate_phone', 'address', 'city', 'country',
            'status', 'source', 'assigned_to', 'lifetime_value', 'credit_rating',
            'notes', 'tags', 'preferences', 'last_contact_date', 'next_follow_up_date',
            'is_active'
        ]


# ============================================================================
# COMPANY SERIALIZERS
# ============================================================================

class CompanyListSerializer(serializers.ModelSerializer):
    """
    Serializer for Company list view
    """
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)
    client_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'company_number', 'company_name', 'industry', 'company_size',
            'status', 'assigned_to', 'assigned_to_name', 'annual_revenue',
            'client_count', 'website', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company_number', 'created_at', 'updated_at']

    def get_client_count(self, obj):
        return obj.clients.filter(is_deleted=False).count()


class CompanyDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Company detail view
    """
    assigned_to_details = serializers.SerializerMethodField()
    client_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'company_number', 'company_name', 'industry', 'company_size',
            'tax_id', 'registration_number', 'email', 'phone', 'website',
            'address', 'city', 'country', 'status', 'assigned_to',
            'assigned_to_details', 'annual_revenue', 'employee_count',
            'founded_year', 'description', 'notes', 'tags', 'social_media',
            'client_count', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company_number', 'created_at', 'updated_at']

    def get_assigned_to_details(self, obj):
        if obj.assigned_to:
            return {
                'id': obj.assigned_to.id,
                'employee_number': obj.assigned_to.employee_number,
                'full_name': obj.assigned_to.full_name,
                'email': obj.assigned_to.user.email if obj.assigned_to.user else None,
            }
        return None

    def get_client_count(self, obj):
        return obj.clients.filter(is_deleted=False).count()


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating Company
    """
    class Meta:
        model = Company
        fields = [
            'company_name', 'industry', 'company_size', 'tax_id', 'registration_number',
            'email', 'phone', 'website', 'address', 'city', 'country', 'status',
            'assigned_to', 'annual_revenue', 'employee_count', 'founded_year',
            'description', 'notes', 'tags', 'social_media', 'is_active'
        ]


# ============================================================================
# CONTACT SERIALIZERS
# ============================================================================

class ContactListSerializer(serializers.ModelSerializer):
    """
    Serializer for Contact list view
    """
    company_name = serializers.CharField(source='company.company_name', read_only=True, allow_null=True)
    client_name = serializers.CharField(source='client.full_name', read_only=True, allow_null=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            'id', 'contact_number', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'company', 'company_name', 'client', 'client_name',
            'position', 'contact_type', 'is_primary', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'contact_number', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class ContactDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Contact detail view
    """
    company_details = serializers.SerializerMethodField()
    client_details = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            'id', 'contact_number', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'alternate_phone', 'company', 'company_details',
            'client', 'client_details', 'position', 'department', 'contact_type',
            'is_primary', 'preferred_contact_method', 'address', 'city', 'country',
            'linkedin_url', 'twitter_handle', 'notes', 'last_contact_date',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'contact_number', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_company_details(self, obj):
        if obj.company:
            return {
                'id': obj.company.id,
                'company_number': obj.company.company_number,
                'company_name': obj.company.company_name,
            }
        return None

    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'client_number': obj.client.client_number,
                'full_name': f"{obj.client.first_name} {obj.client.last_name}",
            }
        return None


class ContactCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating Contact
    """
    class Meta:
        model = Contact
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'alternate_phone',
            'company', 'client', 'position', 'department', 'contact_type',
            'is_primary', 'preferred_contact_method', 'address', 'city',
            'country', 'linkedin_url', 'twitter_handle', 'notes',
            'last_contact_date', 'is_active'
        ]


# ============================================================================
# DEAL SERIALIZERS
# ============================================================================

class DealListSerializer(serializers.ModelSerializer):
    """
    Serializer for Deal list view
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True, allow_null=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)

    class Meta:
        model = Deal
        fields = [
            'id', 'deal_number', 'deal_name', 'client', 'client_name',
            'deal_value', 'currency', 'stage', 'probability', 'assigned_to',
            'assigned_to_name', 'expected_close_date', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'deal_number', 'created_at', 'updated_at']


class DealDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Deal detail view
    """
    client_details = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = [
            'id', 'deal_number', 'deal_name', 'description', 'client',
            'client_details', 'deal_value', 'currency', 'stage', 'probability',
            'assigned_to', 'assigned_to_details', 'deal_source', 'products_services',
            'expected_close_date', 'actual_close_date', 'status', 'lost_reason',
            'notes', 'tags', 'activities_log', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'deal_number', 'created_at', 'updated_at']

    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'client_number': obj.client.client_number,
                'full_name': f"{obj.client.first_name} {obj.client.last_name}",
                'email': obj.client.email,
            }
        return None

    def get_assigned_to_details(self, obj):
        if obj.assigned_to:
            return {
                'id': obj.assigned_to.id,
                'employee_number': obj.assigned_to.employee_number,
                'full_name': obj.assigned_to.full_name,
            }
        return None


class DealCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating Deal
    """
    class Meta:
        model = Deal
        fields = [
            'deal_name', 'description', 'client', 'deal_value', 'currency',
            'stage', 'probability', 'assigned_to', 'deal_source',
            'products_services', 'expected_close_date', 'actual_close_date',
            'status', 'lost_reason', 'notes', 'tags', 'activities_log', 'is_active'
        ]


# ============================================================================
# PROJECT SERIALIZERS
# ============================================================================

class ProjectListSerializer(serializers.ModelSerializer):
    """
    Serializer for Project list view
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True, allow_null=True)
    project_manager_name = serializers.CharField(source='project_manager.full_name', read_only=True, allow_null=True)

    class Meta:
        model = Project
        fields = [
            'id', 'project_number', 'project_name', 'client', 'client_name',
            'project_type', 'status', 'priority', 'project_manager',
            'project_manager_name', 'start_date', 'end_date', 'budget',
            'actual_cost', 'completion_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'project_number', 'created_at', 'updated_at']


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Project detail view
    """
    client_details = serializers.SerializerMethodField()
    project_manager_details = serializers.SerializerMethodField()
    team_member_details = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'project_number', 'project_name', 'description', 'client',
            'client_details', 'project_type', 'status', 'priority',
            'project_manager', 'project_manager_details', 'team_members',
            'team_member_details', 'start_date', 'end_date', 'budget',
            'actual_cost', 'completion_percentage', 'milestones', 'deliverables',
            'risks', 'dependencies', 'notes', 'attachments', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'project_number', 'created_at', 'updated_at']

    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'client_number': obj.client.client_number,
                'full_name': f"{obj.client.first_name} {obj.client.last_name}",
            }
        return None

    def get_project_manager_details(self, obj):
        if obj.project_manager:
            return {
                'id': obj.project_manager.id,
                'employee_number': obj.project_manager.employee_number,
                'full_name': obj.project_manager.full_name,
            }
        return None

    def get_team_member_details(self, obj):
        return [{
            'id': member.id,
            'employee_number': member.employee_number,
            'full_name': member.full_name,
        } for member in obj.team_members.all()]


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating Project
    """
    class Meta:
        model = Project
        fields = [
            'project_name', 'description', 'client', 'project_type', 'status',
            'priority', 'project_manager', 'team_members', 'start_date',
            'end_date', 'budget', 'actual_cost', 'completion_percentage',
            'milestones', 'deliverables', 'risks', 'dependencies', 'notes',
            'attachments', 'is_active'
        ]


# ============================================================================
# TICKET SERIALIZERS
# ============================================================================

class TicketListSerializer(serializers.ModelSerializer):
    """
    Serializer for Ticket list view
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True, allow_null=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'subject', 'client', 'client_name',
            'category', 'priority', 'status', 'assigned_to', 'assigned_to_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'ticket_number', 'created_at', 'updated_at']


class TicketDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Ticket detail view
    """
    client_details = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()
    created_by_details = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'subject', 'description', 'client',
            'client_details', 'category', 'priority', 'status', 'assigned_to',
            'assigned_to_details', 'created_by', 'created_by_details',
            'due_date', 'resolved_at', 'resolution_notes', 'attachments',
            'communication_log', 'tags', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'ticket_number', 'created_at', 'updated_at']

    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'client_number': obj.client.client_number,
                'full_name': f"{obj.client.first_name} {obj.client.last_name}",
                'email': obj.client.email,
                'phone': obj.client.phone,
            }
        return None

    def get_assigned_to_details(self, obj):
        if obj.assigned_to:
            return {
                'id': obj.assigned_to.id,
                'employee_number': obj.assigned_to.employee_number,
                'full_name': obj.assigned_to.full_name,
            }
        return None

    def get_created_by_details(self, obj):
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'employee_number': obj.created_by.employee_number,
                'full_name': obj.created_by.full_name,
            }
        return None


class TicketCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating Ticket
    """
    class Meta:
        model = Ticket
        fields = [
            'subject', 'description', 'client', 'category', 'priority',
            'status', 'assigned_to', 'created_by', 'due_date', 'resolved_at',
            'resolution_notes', 'attachments', 'communication_log', 'tags', 'is_active'
        ]
