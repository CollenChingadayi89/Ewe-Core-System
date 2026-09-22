"""
Finance Document Views
ViewSets for Invoice, Estimate, and Payment models
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Invoice, Estimate, Payment
from .serializers import (
    InvoiceListSerializer, InvoiceDetailSerializer, InvoiceCreateUpdateSerializer,
    EstimateListSerializer, EstimateDetailSerializer, EstimateCreateUpdateSerializer,
    PaymentListSerializer, PaymentDetailSerializer, PaymentCreateUpdateSerializer,
)


# ============================================================================
# INVOICE VIEWSET
# ============================================================================

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices

    Endpoints:
    - GET /api/invoices/ - List invoices
    - POST /api/invoices/ - Create invoice
    - GET /api/invoices/{id}/ - Retrieve invoice
    - PUT /api/invoices/{id}/ - Update invoice
    - PATCH /api/invoices/{id}/ - Partial update
    - DELETE /api/invoices/{id}/ - Delete (soft delete)

    Filters: status, client, project, payment_terms
    Search: invoice_number
    Ordering: created_at, invoice_date, due_date, total_amount
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client', 'project', 'payment_terms']
    search_fields = ['invoice_number']
    ordering_fields = ['created_at', 'invoice_date', 'due_date', 'total_amount']
    ordering = ['-created_at']

    def get_queryset(self):
        return Invoice.objects.filter(is_deleted=False).select_related('client', 'project')

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return InvoiceCreateUpdateSerializer
        return InvoiceDetailSerializer

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()

    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        """Mark invoice as sent"""
        invoice = self.get_object()
        invoice.status = 'sent'
        invoice.save()
        return Response({'status': 'Invoice marked as sent'})

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as fully paid"""
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.amount_paid = invoice.total_amount
        invoice.amount_due = 0
        invoice.save()
        return Response({'status': 'Invoice marked as paid'})

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get all overdue invoices"""
        queryset = self.filter_queryset(self.get_queryset())
        overdue = queryset.filter(
            due_date__lt=timezone.now().date(),
            status__in=['sent', 'viewed', 'partially_paid']
        )
        serializer = self.get_serializer(overdue, many=True)
        return Response(serializer.data)


# ============================================================================
# ESTIMATE VIEWSET
# ============================================================================

class EstimateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing estimates

    Endpoints:
    - GET /api/estimates/ - List estimates
    - POST /api/estimates/ - Create estimate
    - GET /api/estimates/{id}/ - Retrieve estimate
    - PUT /api/estimates/{id}/ - Update estimate
    - PATCH /api/estimates/{id}/ - Partial update
    - DELETE /api/estimates/{id}/ - Delete (soft delete)

    Filters: status, client, deal
    Search: estimate_number
    Ordering: created_at, estimate_date, valid_until, total_amount
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client', 'deal']
    search_fields = ['estimate_number']
    ordering_fields = ['created_at', 'estimate_date', 'valid_until', 'total_amount']
    ordering = ['-created_at']

    def get_queryset(self):
        return Estimate.objects.filter(is_deleted=False).select_related('client', 'deal')

    def get_serializer_class(self):
        if self.action == 'list':
            return EstimateListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EstimateCreateUpdateSerializer
        return EstimateDetailSerializer

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        """Convert estimate to invoice"""
        estimate = self.get_object()

        if estimate.status == 'converted':
            return Response(
                {'error': 'Estimate already converted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create invoice from estimate
        invoice = Invoice.objects.create(
            invoice_date=timezone.now().date(),
            due_date=timezone.now().date() + timezone.timedelta(days=30),
            client=estimate.client,
            billing_address=estimate.billing_address,
            billing_email=estimate.contact_email,
            subtotal=estimate.subtotal,
            tax_rate=estimate.tax_rate,
            tax_amount=estimate.tax_amount,
            discount_amount=estimate.discount_amount,
            total_amount=estimate.total_amount,
            amount_paid=0,
            amount_due=estimate.total_amount,
            currency=estimate.currency,
            line_items=estimate.line_items,
            payment_terms=estimate.payment_terms,
            status='draft',
            deal=estimate.deal,
        )

        # Update estimate
        estimate.status = 'converted'
        estimate.converted_to_invoice = invoice
        estimate.save()

        from .serializers import InvoiceDetailSerializer
        return Response(InvoiceDetailSerializer(invoice).data)

    @action(detail=True, methods=['post'])
    def mark_accepted(self, request, pk=None):
        """Mark estimate as accepted"""
        estimate = self.get_object()
        estimate.status = 'accepted'
        estimate.save()
        return Response({'status': 'Estimate marked as accepted'})

    @action(detail=True, methods=['post'])
    def mark_rejected(self, request, pk=None):
        """Mark estimate as rejected"""
        estimate = self.get_object()
        estimate.status = 'rejected'
        estimate.save()
        return Response({'status': 'Estimate marked as rejected'})


# ============================================================================
# PAYMENT VIEWSET
# ============================================================================

class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payments

    Endpoints:
    - GET /api/payments/ - List payments
    - POST /api/payments/ - Create payment
    - GET /api/payments/{id}/ - Retrieve payment
    - PUT /api/payments/{id}/ - Update payment
    - PATCH /api/payments/{id}/ - Partial update
    - DELETE /api/payments/{id}/ - Delete (soft delete)

    Filters: status, payment_method, invoice
    Search: payment_number, transaction_reference
    Ordering: created_at, payment_date, amount
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'invoice']
    search_fields = ['payment_number', 'transaction_reference']
    ordering_fields = ['created_at', 'payment_date', 'amount']
    ordering = ['-created_at']

    def get_queryset(self):
        return Payment.objects.filter(is_deleted=False).select_related('invoice', 'processed_by')

    def get_serializer_class(self):
        if self.action == 'list':
            return PaymentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PaymentCreateUpdateSerializer
        return PaymentDetailSerializer

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()

    def perform_create(self, serializer):
        """Update invoice amounts when payment is created"""
        payment = serializer.save()

        if payment.invoice and payment.status == 'completed':
            invoice = payment.invoice
            invoice.amount_paid += payment.amount
            invoice.amount_due = invoice.total_amount - invoice.amount_paid

            if invoice.amount_due == 0:
                invoice.status = 'paid'
            elif invoice.amount_paid > 0:
                invoice.status = 'partially_paid'

            invoice.save()

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify payment"""
        payment = self.get_object()
        payment.status = 'completed'
        payment.save()

        # Update invoice
        if payment.invoice:
            invoice = payment.invoice
            invoice.amount_paid += payment.amount
            invoice.amount_due = invoice.total_amount - invoice.amount_paid

            if invoice.amount_due == 0:
                invoice.status = 'paid'
            elif invoice.amount_paid > 0:
                invoice.status = 'partially_paid'

            invoice.save()

        return Response({'status': 'Payment verified'})

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund payment"""
        payment = self.get_object()
        payment.status = 'refunded'
        payment.save()

        # Update invoice
        if payment.invoice:
            invoice = payment.invoice
            invoice.amount_paid -= payment.amount
            invoice.amount_due = invoice.total_amount - invoice.amount_paid
            invoice.status = 'refunded' if invoice.amount_paid == 0 else 'partially_paid'
            invoice.save()

        return Response({'status': 'Payment refunded'})
