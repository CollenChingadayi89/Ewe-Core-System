"""
CRM Module Views
ViewSets for Client, Company, Contact, Deal, Project, and Ticket models
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Client, Company, Contact, Deal, Project, Ticket
from .serializers import (
    ClientListSerializer, ClientDetailSerializer, ClientCreateUpdateSerializer,
    CompanyListSerializer, CompanyDetailSerializer, CompanyCreateUpdateSerializer,
    ContactListSerializer, ContactDetailSerializer, ContactCreateUpdateSerializer,
    DealListSerializer, DealDetailSerializer, DealCreateUpdateSerializer,
    ProjectListSerializer, ProjectDetailSerializer, ProjectCreateUpdateSerializer,
    TicketListSerializer, TicketDetailSerializer, TicketCreateUpdateSerializer,
)


# ============================================================================
# CLIENT VIEWSET
# ============================================================================

class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing clients

    Endpoints:
    - GET /api/clients/ - List clients
    - POST /api/clients/ - Create client
    - GET /api/clients/{id}/ - Retrieve client details
    - PUT /api/clients/{id}/ - Update client
    - PATCH /api/clients/{id}/ - Partial update client
    - DELETE /api/clients/{id}/ - Delete client (soft delete)

    Filters: client_type, status, credit_rating, assigned_to, company
    Search: first_name, last_name, email, phone, client_number
    Ordering: created_at, updated_at, lifetime_value, last_contact_date
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client_type', 'status', 'credit_rating', 'assigned_to', 'company']
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'client_number']
    ordering_fields = ['created_at', 'updated_at', 'lifetime_value', 'last_contact_date']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return non-deleted clients"""
        return Client.objects.filter(is_deleted=False).select_related('company', 'assigned_to')

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ClientListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ClientCreateUpdateSerializer
        return ClientDetailSerializer

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.is_deleted = True
        instance.save()

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get clients grouped by status"""
        queryset = self.filter_queryset(self.get_queryset())

        result = {
            'lead': queryset.filter(status='lead').count(),
            'prospect': queryset.filter(status='prospect').count(),
            'active': queryset.filter(status='active').count(),
            'inactive': queryset.filter(status='inactive').count(),
            'churned': queryset.filter(status='churned').count(),
        }

        return Response(result)


# ============================================================================
# COMPANY VIEWSET
# ============================================================================

class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing companies

    Endpoints:
    - GET /api/companies/ - List companies
    - POST /api/companies/ - Create company
    - GET /api/companies/{id}/ - Retrieve company details
    - PUT /api/companies/{id}/ - Update company
    - PATCH /api/companies/{id}/ - Partial update company
    - DELETE /api/companies/{id}/ - Delete company (soft delete)

    Filters: industry, company_size, status, assigned_to
    Search: company_name, email, phone, company_number, tax_id
    Ordering: created_at, updated_at, company_name, annual_revenue
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry', 'company_size', 'status', 'assigned_to']
    search_fields = ['company_name', 'email', 'phone', 'company_number', 'tax_id']
    ordering_fields = ['created_at', 'updated_at', 'company_name', 'annual_revenue']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return non-deleted companies"""
        return Company.objects.filter(is_deleted=False).select_related('assigned_to')

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return CompanyListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CompanyCreateUpdateSerializer
        return CompanyDetailSerializer

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.is_deleted = True
        instance.save()


# ============================================================================
# CONTACT VIEWSET
# ============================================================================

class ContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contacts

    Endpoints:
    - GET /api/contacts/ - List contacts
    - POST /api/contacts/ - Create contact
    - GET /api/contacts/{id}/ - Retrieve contact details
    - PUT /api/contacts/{id}/ - Update contact
    - PATCH /api/contacts/{id}/ - Partial update contact
    - DELETE /api/contacts/{id}/ - Delete contact (soft delete)

    Filters: contact_type, is_primary, company, client
    Search: first_name, last_name, email, phone, contact_number
    Ordering: created_at, updated_at, last_contact_date
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['contact_type', 'is_primary', 'company', 'client']
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'contact_number']
    ordering_fields = ['created_at', 'updated_at', 'last_contact_date']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return non-deleted contacts"""
        return Contact.objects.filter(is_deleted=False).select_related('company', 'client')

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ContactListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ContactCreateUpdateSerializer
        return ContactDetailSerializer

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.is_deleted = True
        instance.save()


# ============================================================================
# DEAL VIEWSET
# ============================================================================

class DealViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing deals

    Endpoints:
    - GET /api/deals/ - List deals
    - POST /api/deals/ - Create deal
    - GET /api/deals/{id}/ - Retrieve deal details
    - PUT /api/deals/{id}/ - Update deal
    - PATCH /api/deals/{id}/ - Partial update deal
    - DELETE /api/deals/{id}/ - Delete deal (soft delete)

    Filters: stage, status, probability, assigned_to, client
    Search: deal_name, deal_number
    Ordering: created_at, updated_at, deal_value, expected_close_date
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['stage', 'status', 'probability', 'assigned_to', 'client']
    search_fields = ['deal_name', 'deal_number']
    ordering_fields = ['created_at', 'updated_at', 'deal_value', 'expected_close_date']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return non-deleted deals"""
        return Deal.objects.filter(is_deleted=False).select_related('client', 'assigned_to')

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return DealListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return DealCreateUpdateSerializer
        return DealDetailSerializer

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.is_deleted = True
        instance.save()

    @action(detail=False, methods=['get'])
    def pipeline(self, request):
        """Get deals grouped by stage"""
        queryset = self.filter_queryset(self.get_queryset())

        result = {
            'prospecting': {
                'count': queryset.filter(stage='prospecting').count(),
                'total_value': sum(
                    float(deal.deal_value) for deal in queryset.filter(stage='prospecting')
                )
            },
            'qualification': {
                'count': queryset.filter(stage='qualification').count(),
                'total_value': sum(
                    float(deal.deal_value) for deal in queryset.filter(stage='qualification')
                )
            },
            'proposal': {
                'count': queryset.filter(stage='proposal').count(),
                'total_value': sum(
                    float(deal.deal_value) for deal in queryset.filter(stage='proposal')
                )
            },
            'negotiation': {
                'count': queryset.filter(stage='negotiation').count(),
                'total_value': sum(
                    float(deal.deal_value) for deal in queryset.filter(stage='negotiation')
                )
            },
            'closed_won': {
                'count': queryset.filter(stage='closed_won').count(),
                'total_value': sum(
                    float(deal.deal_value) for deal in queryset.filter(stage='closed_won')
                )
            },
            'closed_lost': {
                'count': queryset.filter(stage='closed_lost').count(),
                'total_value': sum(
                    float(deal.deal_value) for deal in queryset.filter(stage='closed_lost')
                )
            },
        }

        return Response(result)


# ============================================================================
# PROJECT VIEWSET
# ============================================================================

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects

    Endpoints:
    - GET /api/projects/ - List projects
    - POST /api/projects/ - Create project
    - GET /api/projects/{id}/ - Retrieve project details
    - PUT /api/projects/{id}/ - Update project
    - PATCH /api/projects/{id}/ - Partial update project
    - DELETE /api/projects/{id}/ - Delete project (soft delete)

    Filters: project_type, status, priority, project_manager, client
    Search: project_name, project_number
    Ordering: created_at, updated_at, start_date, end_date, completion_percentage
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project_type', 'status', 'priority', 'project_manager', 'client']
    search_fields = ['project_name', 'project_number']
    ordering_fields = ['created_at', 'updated_at', 'start_date', 'end_date', 'completion_percentage']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return non-deleted projects"""
        return Project.objects.filter(is_deleted=False).select_related(
            'client', 'project_manager'
        ).prefetch_related('team_members')

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.is_deleted = True
        instance.save()

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get projects grouped by status"""
        queryset = self.filter_queryset(self.get_queryset())

        result = {
            'planning': queryset.filter(status='planning').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'on_hold': queryset.filter(status='on_hold').count(),
            'completed': queryset.filter(status='completed').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
        }

        return Response(result)


# ============================================================================
# TICKET VIEWSET
# ============================================================================

class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tickets

    Endpoints:
    - GET /api/tickets/ - List tickets
    - POST /api/tickets/ - Create ticket
    - GET /api/tickets/{id}/ - Retrieve ticket details
    - PUT /api/tickets/{id}/ - Update ticket
    - PATCH /api/tickets/{id}/ - Partial update ticket
    - DELETE /api/tickets/{id}/ - Delete ticket (soft delete)

    Filters: category, priority, status, assigned_to, client, created_by
    Search: subject, ticket_number
    Ordering: created_at, updated_at, due_date, priority
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'priority', 'status', 'assigned_to', 'client', 'created_by']
    search_fields = ['subject', 'ticket_number']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return non-deleted tickets"""
        return Ticket.objects.filter(is_deleted=False).select_related(
            'client', 'assigned_to', 'created_by'
        )

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return TicketListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TicketCreateUpdateSerializer
        return TicketDetailSerializer

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.is_deleted = True
        instance.save()

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark ticket as resolved"""
        ticket = self.get_object()
        resolution_notes = request.data.get('resolution_notes', '')

        from django.utils import timezone
        ticket.status = 'closed'
        ticket.resolved_at = timezone.now()
        ticket.resolution_notes = resolution_notes
        ticket.save()

        serializer = self.get_serializer(ticket)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Reopen a closed ticket"""
        ticket = self.get_object()
        ticket.status = 'open'
        ticket.resolved_at = None
        ticket.save()

        serializer = self.get_serializer(ticket)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get tickets grouped by status"""
        queryset = self.filter_queryset(self.get_queryset())

        result = {
            'open': queryset.filter(status='open').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'pending': queryset.filter(status='pending').count(),
            'resolved': queryset.filter(status='resolved').count(),
            'closed': queryset.filter(status='closed').count(),
        }

        return Response(result)
