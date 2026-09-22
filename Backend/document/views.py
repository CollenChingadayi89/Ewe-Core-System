from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import DocumentCategory, Document
from .serializers import DocumentCategorySerializer, DocumentSerializer
from approval.utils import auto_create_approval_request


class DocumentCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for DocumentCategory model"""
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['is_active', 'parent_category']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Document model with approval workflow integration"""
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['status', 'category', 'access_level', 'uploaded_by', 'is_latest_version']
    search_fields = ['document_number', 'title', 'description', 'tags']
    ordering_fields = ['upload_date', 'title', 'version', 'created_at']
    ordering = ['-upload_date', '-version']

    def create(self, request, *args, **kwargs):
        """
        Create document and auto-create approval request for restricted/confidential documents.
        """
        response = super().create(request, *args, **kwargs)

        if response.status_code == status.HTTP_201_CREATED:
            document = Document.objects.get(id=response.data['id'])

            # Only create approval request for restricted/confidential documents
            if document.access_level in ['restricted', 'confidential']:
                # Get requester's employee profile
                try:
                    requester = request.user.employee_profile
                except AttributeError:
                    # If user doesn't have employee profile, skip approval creation
                    return response

                # Auto-create approval request
                # Use 'document' workflow type (simple 1-stage approval)
                # Priority based on access level
                priority = 'high' if document.access_level == 'confidential' else 'medium'

                auto_create_approval_request(
                    content_object=document,
                    requester=requester,
                    workflow_type='document',
                    priority=priority,
                    amount=None  # Documents don't have amounts
                )

        return response

