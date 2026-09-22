"""
CRM Module URL Configuration
Routes for Client, Company, Contact, Deal, Project, and Ticket endpoints
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ClientViewSet,
    CompanyViewSet,
    ContactViewSet,
    DealViewSet,
    ProjectViewSet,
    TicketViewSet,
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'deals', DealViewSet, basename='deal')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tickets', TicketViewSet, basename='ticket')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]
