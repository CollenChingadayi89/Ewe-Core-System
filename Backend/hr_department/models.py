from django.db import models
from django.conf import settings
from core.models import BaseModel


class Department(BaseModel):
    """
    Organizational department structure.
    Supports hierarchical department organization with parent-child relationships.
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Department Code',
        help_text='Unique department identifier (e.g., DEPT001)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Department Name'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description'
    )
    manager = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_departments',
        verbose_name='Department Manager'
    )
    parent_department = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_departments',
        verbose_name='Parent Department'
    )
    employee_count = models.IntegerField(
        default=0,
        verbose_name='Employee Count',
        help_text='Number of employees in this department'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Is Active'
    )

    class Meta:
        db_table = 'hr_department'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['code']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Designation(BaseModel):
    """
    Job positions/titles within departments.
    Defines roles, levels, and salary ranges for positions.
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Designation Code',
        help_text='Unique designation identifier (e.g., DES001)'
    )
    title = models.CharField(
        max_length=100,
        verbose_name='Job Title'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='designations',
        verbose_name='Department'
    )
    level = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Job Level',
        help_text='e.g., Junior, Senior, Manager, Director'
    )
    grade = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Pay Grade',
        help_text='e.g., G1, G2, M1, M2, E1'
    )
    salary_range_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Minimum Salary (ZWG)'
    )
    salary_range_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Maximum Salary (ZWG)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Job Description'
    )
    requirements = models.TextField(
        blank=True,
        null=True,
        verbose_name='Job Requirements',
        help_text='Qualifications, skills, and experience required'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Is Active'
    )

    class Meta:
        db_table = 'hr_designation'
        verbose_name = 'Designation'
        verbose_name_plural = 'Designations'
        ordering = ['department', 'title']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['title']),
            models.Index(fields=['department', 'is_active']),
        ]

    def __str__(self):
        return f"{self.title} ({self.department.name})"
