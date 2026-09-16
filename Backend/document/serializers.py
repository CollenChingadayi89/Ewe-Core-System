from rest_framework import serializers
from .models import DocumentCategory, Document


class DocumentCategorySerializer(serializers.ModelSerializer):
    """Serializer for DocumentCategory model"""

    class Meta:
        model = DocumentCategory
        fields = '__all__'


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model"""

    class Meta:
        model = Document
        fields = '__all__'

