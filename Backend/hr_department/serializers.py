"""
HR Department Serializers
Provides nested representations and optimized data structures for departments and designations.
"""

from rest_framework import serializers
from .models import Department, Designation


class ManagerBriefSerializer(serializers.Serializer):
    """Brief manager information for nested display"""
    id = serializers.UUIDField(read_only=True)
    employee_number = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True, source='user.email')


class DepartmentListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for department list views.
    Includes manager name and sub-department count.
    """
    manager_name = serializers.SerializerMethodField()
    parent_department_name = serializers.CharField(
        source='parent_department.name',
        read_only=True,
        allow_null=True
    )
    sub_department_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id',
            'code',
            'name',
            'description',
            'manager',
            'manager_name',
            'parent_department',
            'parent_department_name',
            'employee_count',
            'sub_department_count',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'employee_count']

    def get_manager_name(self, obj):
        """Get manager's full name"""
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}"
        return None

    def get_sub_department_count(self, obj):
        """Count sub-departments"""
        return obj.sub_departments.filter(is_active=True).count()


class DepartmentDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for department detail views.
    Includes nested manager info and sub-departments.
    """
    manager_details = ManagerBriefSerializer(source='manager', read_only=True)
    parent_department_details = serializers.SerializerMethodField()
    sub_departments = serializers.SerializerMethodField()
    designation_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id',
            'code',
            'name',
            'description',
            'manager',
            'manager_details',
            'parent_department',
            'parent_department_details',
            'sub_departments',
            'employee_count',
            'designation_count',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'modified_by',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'employee_count']

    def get_parent_department_details(self, obj):
        """Get parent department info"""
        if obj.parent_department:
            return {
                'id': str(obj.parent_department.id),
                'code': obj.parent_department.code,
                'name': obj.parent_department.name,
            }
        return None

    def get_sub_departments(self, obj):
        """Get list of sub-departments"""
        return [
            {
                'id': str(dept.id),
                'code': dept.code,
                'name': dept.name,
                'employee_count': dept.employee_count,
            }
            for dept in obj.sub_departments.filter(is_active=True)
        ]

    def get_designation_count(self, obj):
        """Count active designations in this department"""
        return obj.designations.filter(is_active=True).count()


class DepartmentSerializer(serializers.ModelSerializer):
    """Standard serializer for department create/update operations"""

    class Meta:
        model = Department
        fields = [
            'id',
            'code',
            'name',
            'description',
            'manager',
            'parent_department',
            'is_active',
        ]
        read_only_fields = ['id']

    def validate_parent_department(self, value):
        """Prevent circular references in department hierarchy"""
        if value and self.instance:
            # Check if trying to set parent as self
            if value.id == self.instance.id:
                raise serializers.ValidationError("Department cannot be its own parent.")

            # Check if trying to create circular reference
            current = value
            while current.parent_department:
                if current.parent_department.id == self.instance.id:
                    raise serializers.ValidationError(
                        "This would create a circular reference in the department hierarchy."
                    )
                current = current.parent_department

        return value


class DesignationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for designation list views.
    """
    department_name = serializers.CharField(source='department.name', read_only=True)
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Designation
        fields = [
            'id',
            'code',
            'title',
            'department',
            'department_name',
            'level',
            'grade',
            'salary_range_min',
            'salary_range_max',
            'employee_count',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_employee_count(self, obj):
        """Count employees with this designation"""
        return obj.employees.filter(is_active=True).count()


class DesignationDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for designation detail views.
    """
    department_details = serializers.SerializerMethodField()

    class Meta:
        model = Designation
        fields = [
            'id',
            'code',
            'title',
            'department',
            'department_details',
            'level',
            'grade',
            'salary_range_min',
            'salary_range_max',
            'description',
            'requirements',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'modified_by',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_department_details(self, obj):
        """Get department info"""
        return {
            'id': str(obj.department.id),
            'code': obj.department.code,
            'name': obj.department.name,
        }


class DesignationSerializer(serializers.ModelSerializer):
    """Standard serializer for designation create/update operations"""

    class Meta:
        model = Designation
        fields = [
            'id',
            'code',
            'title',
            'department',
            'level',
            'grade',
            'salary_range_min',
            'salary_range_max',
            'description',
            'requirements',
            'is_active',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        """Validate salary ranges"""
        salary_min = attrs.get('salary_range_min')
        salary_max = attrs.get('salary_range_max')

        if salary_min and salary_max and salary_min > salary_max:
            raise serializers.ValidationError({
                'salary_range_max': 'Maximum salary must be greater than minimum salary.'
            })

        return attrs
