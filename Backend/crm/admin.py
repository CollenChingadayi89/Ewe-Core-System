from django.contrib import admin
from .models import Client, Company, Contact, Deal, Project, Ticket


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Admin interface for Client model.
    Manages individual and corporate clients.
    """
    list_display = [
        'client_number',
        'get_full_name',
        'client_type',
        'company',
        'email',
        'phone',
        'status',
        'credit_rating',
        'assigned_to',
        'total_business_value'
    ]
    list_filter = [
        'client_type',
        'status',
        'credit_rating',
        'source',
        'created_at'
    ]
    search_fields = [
        'client_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'company__name'
    ]
    readonly_fields = [
        'id',
        'client_number',
        'total_business_value',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['company', 'assigned_to']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    fieldsets = (
        ('Client Information', {
            'fields': (
                'id',
                'client_number',
                'client_type',
                'first_name',
                'last_name',
                'company',
                'position'
            )
        }),
        ('Contact Details', {
            'fields': (
                'email',
                'phone',
                'alternate_phone',
                'address',
                'city',
                'country'
            )
        }),
        ('Business Information', {
            'fields': (
                'status',
                'source',
                'assigned_to',
                'credit_rating',
                'total_business_value'
            )
        }),
        ('Additional Information', {
            'fields': ('notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Audit Trail', {
            'fields': (
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def get_full_name(self, obj):
        """Return client's full name"""
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'first_name'


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    """
    Admin interface for Company model.
    Manages corporate organizations.
    """
    list_display = [
        'company_number',
        'name',
        'industry',
        'number_of_employees',
        'annual_revenue',
        'account_manager',
        'is_active'
    ]
    list_filter = [
        'industry',
        'number_of_employees',
        'is_active',
        'created_at'
    ]
    search_fields = [
        'company_number',
        'name',
        'trading_name',
        'registration_number',
        'email',
        'phone'
    ]
    readonly_fields = [
        'id',
        'company_number',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['account_manager']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    fieldsets = (
        ('Company Information', {
            'fields': (
                'id',
                'company_number',
                'name',
                'trading_name',
                'registration_number',
                'tax_id',
                'industry'
            )
        }),
        ('Contact Details', {
            'fields': (
                'email',
                'phone',
                'fax',
                'website',
                'address',
                'city',
                'country'
            )
        }),
        ('Business Details', {
            'fields': (
                'number_of_employees',
                'annual_revenue',
                'currency',
                'account_manager'
            )
        }),
        ('Additional Information', {
            'fields': ('description', 'notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Status & Audit', {
            'fields': (
                'is_active',
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """
    Admin interface for Contact model.
    Manages contact persons within companies.
    """
    list_display = [
        'contact_number',
        'get_full_name',
        'position',
        'company',
        'email',
        'phone',
        'is_primary',
        'is_active'
    ]
    list_filter = [
        'contact_type',
        'is_primary',
        'department',
        'is_active',
        'created_at'
    ]
    search_fields = [
        'contact_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'company__name'
    ]
    readonly_fields = [
        'id',
        'contact_number',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['company', 'client']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    fieldsets = (
        ('Contact Information', {
            'fields': (
                'id',
                'contact_number',
                'first_name',
                'last_name',
                'position',
                'department',
                'contact_type'
            )
        }),
        ('Relationships', {
            'fields': ('company', 'client', 'is_primary')
        }),
        ('Contact Details', {
            'fields': (
                'email',
                'phone',
                'mobile',
                'linkedin'
            )
        }),
        ('Additional Information', {
            'fields': ('notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Status & Audit', {
            'fields': (
                'is_active',
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def get_full_name(self, obj):
        """Return contact's full name"""
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'first_name'


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    """
    Admin interface for Deal model.
    Manages sales opportunities and pipeline.
    """
    list_display = [
        'deal_number',
        'title',
        'client',
        'stage',
        'priority',
        'amount',
        'currency',
        'probability',
        'expected_close_date',
        'owner'
    ]
    list_filter = [
        'stage',
        'priority',
        'currency',
        'expected_close_date',
        'created_at'
    ]
    search_fields = [
        'deal_number',
        'title',
        'description',
        'client__first_name',
        'client__last_name',
        'company__name'
    ]
    readonly_fields = [
        'id',
        'deal_number',
        'actual_close_date',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['client', 'company', 'contact', 'owner']
    date_hierarchy = 'expected_close_date'
    ordering = ['-expected_close_date']

    fieldsets = (
        ('Deal Information', {
            'fields': (
                'id',
                'deal_number',
                'title',
                'description',
                'stage',
                'priority'
            )
        }),
        ('Parties Involved', {
            'fields': ('client', 'company', 'contact', 'owner')
        }),
        ('Financial Details', {
            'fields': (
                'amount',
                'currency',
                'probability',
                'expected_close_date',
                'actual_close_date',
                'lost_reason'
            )
        }),
        ('Additional Information', {
            'fields': ('notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Audit Trail', {
            'fields': (
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """
    Admin interface for Project model.
    Manages client projects and deliverables.
    """
    list_display = [
        'project_number',
        'name',
        'client',
        'status',
        'priority',
        'project_manager',
        'progress_percentage',
        'start_date',
        'end_date'
    ]
    list_filter = [
        'status',
        'priority',
        'start_date',
        'end_date',
        'created_at'
    ]
    search_fields = [
        'project_number',
        'name',
        'description',
        'client__first_name',
        'client__last_name',
        'company__name'
    ]
    readonly_fields = [
        'id',
        'project_number',
        'actual_end_date',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['client', 'company', 'deal', 'project_manager', 'team_members']
    filter_horizontal = ['team_members']
    date_hierarchy = 'start_date'
    ordering = ['-start_date']

    fieldsets = (
        ('Project Information', {
            'fields': (
                'id',
                'project_number',
                'name',
                'description',
                'status',
                'priority'
            )
        }),
        ('Parties Involved', {
            'fields': (
                'client',
                'company',
                'deal',
                'project_manager',
                'team_members'
            )
        }),
        ('Schedule & Budget', {
            'fields': (
                'start_date',
                'end_date',
                'actual_end_date',
                'budget',
                'actual_cost',
                'currency',
                'progress_percentage'
            )
        }),
        ('Additional Information', {
            'fields': ('notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Audit Trail', {
            'fields': (
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """
    Admin interface for Ticket model.
    Manages customer support tickets and issues.
    """
    list_display = [
        'ticket_number',
        'subject',
        'client',
        'ticket_type',
        'status',
        'priority',
        'assigned_to',
        'created_at',
        'resolved_at'
    ]
    list_filter = [
        'ticket_type',
        'status',
        'priority',
        'created_at',
        'resolved_at',
        'closed_at'
    ]
    search_fields = [
        'ticket_number',
        'subject',
        'description',
        'client__first_name',
        'client__last_name',
        'contact__first_name',
        'contact__last_name'
    ]
    readonly_fields = [
        'id',
        'ticket_number',
        'resolved_at',
        'closed_at',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['client', 'contact', 'project', 'assigned_to']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    fieldsets = (
        ('Ticket Information', {
            'fields': (
                'id',
                'ticket_number',
                'subject',
                'description',
                'ticket_type',
                'status',
                'priority'
            )
        }),
        ('Parties Involved', {
            'fields': (
                'client',
                'contact',
                'project',
                'assigned_to'
            )
        }),
        ('Resolution', {
            'fields': (
                'resolution',
                'resolution_time_hours',
                'resolved_at',
                'closed_at'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Audit Trail', {
            'fields': (
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )
