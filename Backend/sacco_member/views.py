from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsFinanceOrCreateOnly

from .models import Member
from .serializers import MemberSerializer, MemberLookupSerializer

LOOKUP_LIMIT = 20
MEMBER_NUMBER_ATTEMPTS = 3


def next_member_number() -> str:
    """Next WES-YYYY-### number for the current year."""
    prefix = f"WES-{timezone.now().year}-"
    numbers = [
        int(number.rsplit('-', 1)[-1])
        for number in Member.objects.filter(member_number__startswith=prefix).values_list('member_number', flat=True)
        if number.rsplit('-', 1)[-1].isdigit()
    ]
    return f"{prefix}{(max(numbers) + 1 if numbers else 1):03d}"


class MemberViewSet(viewsets.ModelViewSet):
    """
    SACCO members. Any employee can view and add members (e.g. while raising a payable);
    only Finance can edit or delete them.
    """
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrCreateOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    search_fields = ['member_number', 'first_name', 'last_name']
    filterset_fields = ['account_status']
    ordering_fields = ['member_number', 'last_name', 'created_at']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        extra = {'created_by': request.user}
        if not serializer.validated_data.get('join_date'):
            extra['join_date'] = timezone.localdate()

        if serializer.validated_data.get('member_number'):
            serializer.save(**extra)
        else:
            # Retry if another request took the same number concurrently
            for attempt in range(MEMBER_NUMBER_ATTEMPTS):
                try:
                    with transaction.atomic():
                        serializer.save(member_number=next_member_number(), **extra)
                    break
                except IntegrityError:
                    if attempt == MEMBER_NUMBER_ATTEMPTS - 1:
                        raise ValidationError({'member_number': 'Could not assign a member number. Please try again.'})

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request):
        """
        Search members for pickers: GET /members/lookup/?search=<number or name>
        Returns at most 20 matches with minimal fields.
        """
        queryset = (
            self.filter_queryset(self.get_queryset())
            .filter(is_deleted=False)
            .order_by('last_name', 'first_name')
        )
        serializer = MemberLookupSerializer(queryset[:LOOKUP_LIMIT], many=True)
        return Response(serializer.data)
