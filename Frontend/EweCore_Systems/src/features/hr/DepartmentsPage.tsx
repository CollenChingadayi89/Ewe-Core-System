import { useState, useEffect } from 'react';
import { Row, Col, Button, Card, Avatar, Typography, Space, Modal, Form, Input, Select, Divider, Tag, Spin, Alert, message } from 'antd';
import {
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { PageHeader, FilterBar, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import employeeApiService from '../../services/api/employeeApi';
import type { EmployeeListItem } from '../../types/employee';

// Department type (matching API response from DepartmentListSerializer)
interface DepartmentListItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  manager: string | null; // Manager UUID (matches API field name)
  manager_name?: string; // Manager full name (from API)
  parent_department?: string | null; // Parent department UUID (matches API field name)
  parent_department_name?: string; // Parent department name (from API)
  employee_count: number; // Matches API snake_case
  sub_department_count?: number; // Matches API snake_case
  is_active: boolean; // Matches API snake_case
  created_at?: string;
  updated_at?: string;
}

const { Title, Text } = Typography;
const { TextArea } = Input;

export const DepartmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>('grid');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentListItem | null>(null);
  const [form] = Form.useForm();

  // Local state for departments (no Zustand)
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const [deptsError, setDeptsError] = useState<string | null>(null);

  // Local state for employees (no Zustand)
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [empsLoading, setEmpsLoading] = useState(false);

  // Fetch departments directly
  const fetchDepartmentsData = async () => {
    setDeptsLoading(true);
    setDeptsError(null);
    try {
      const response = await employeeApiService.departments.list({ is_active: true, ordering: 'name', page_size: 1000 });
      setDepartments(response.results as DepartmentListItem[]);
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
      setDeptsError(error.response?.data?.message || 'Failed to load departments');
    } finally {
      setDeptsLoading(false);
    }
  };

  // Fetch all employees (not just managers) for manager dropdown
  const fetchEmployeesData = async () => {
    setEmpsLoading(true);
    try {
      // Fetch all active employees without role filtering
      const response = await employeeApiService.employees.list({
        is_active: true,
        page_size: 1000,
        ordering: 'first_name'
      });
      setEmployees(response.results);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setEmpsLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchDepartmentsData();
    fetchEmployeesData();
  }, []);

  // Calculate statistics
  const totalDepartments = departments.length;
  const totalEmployees = departments.reduce((sum, dept) => sum + dept.employee_count, 0);
  const avgEmployeesPerDept = totalDepartments > 0 ? Math.round(totalEmployees / totalDepartments) : 0;
  const topDepartments = [...departments].sort((a, b) => b.employee_count - a.employee_count);

  // Filter departments based on search
  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get department hierarchy
  const rootDepartments = filteredDepartments.filter(dept => !dept.parent_department);
  const getChildDepartments = (parentId: string) => {
    return filteredDepartments.filter(dept => dept.parent_department === parentId);
  };

  // Get employee by ID
  const getEmployeeById = (id: string | null) => {
    if (!id) return null;
    return employees.find(emp => emp.id === id);
  };

  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search departments by name...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 300,
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
  };

  // Generate department code
  const generateDepartmentCode = () => {
    // Generate code based on department count: DEPT-001, DEPT-002, etc.
    const nextNumber = (departments.length + 1).toString().padStart(3, '0');
    return `DEPT-${nextNumber}`;
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    form.resetFields();
    // Auto-generate department code for new departments
    form.setFieldsValue({
      code: generateDepartmentCode(),
    });
    setIsModalVisible(true);
  };

  const handleEditDepartment = (dept: DepartmentListItem) => {
    setEditingDepartment(dept);
    form.setFieldsValue({
      code: dept.code,
      name: dept.name,
      description: dept.description,
      managerId: dept.manager,
      parentId: dept.parent_department,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      const departmentData = {
        code: values.code,
        name: values.name,
        description: values.description,
        manager: values.managerId || null,
        parent_department: values.parentId || null,
        is_active: true,
      };

      setDeptsLoading(true);
      setDeptsError(null);

      if (editingDepartment) {
        // Update existing department
        await employeeApiService.departments.update(editingDepartment.id, departmentData);
        message.success('Department updated successfully');
        setIsModalVisible(false);
        form.resetFields();
        setEditingDepartment(null);
        await fetchDepartmentsData(); // Refresh list
      } else {
        // Create new department
        await employeeApiService.departments.create(departmentData);
        message.success('Department created successfully');
        setIsModalVisible(false);
        form.resetFields();
        await fetchDepartmentsData(); // Refresh list
      }
    } catch (error: any) {
      console.error('Failed to save department:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || 'Failed to save department';
      message.error(errorMsg);
    } finally {
      setDeptsLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDepartment(null);
  };

  const handleDeleteDepartment = (dept: DepartmentListItem) => {
    Modal.confirm({
      title: 'Delete Department',
      content: `Are you sure you want to delete ${dept.name}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setDeptsLoading(true);
          await employeeApiService.departments.delete(dept.id);
          message.success('Department deleted successfully');
          await fetchDepartmentsData(); // Refresh list
        } catch (error: any) {
          console.error('Failed to delete department:', error);
          const errorMsg = error.response?.data?.message || error.response?.data?.detail || 'Failed to delete department';
          message.error(errorMsg);
        } finally {
          setDeptsLoading(false);
        }
      },
    });
  };

  const DepartmentCard = ({ dept }: { dept: DepartmentListItem }) => {
    const manager = getEmployeeById(dept.manager);
    const childDepartments = getChildDepartments(dept.id);

    return (
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          height: '100%',
          border: '1px solid #f0f0f0',
          transition: 'all 0.3s ease',
        }}
        bodyStyle={{ padding: '20px' }}
        hoverable
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        }}
      >
        {/* Department Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                }}
              >
                <BankOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#32373c',
                    marginBottom: '4px',
                  }}
                >
                  {dept.name}
                </Title>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  {dept.description || 'No description'}
                </Text>
              </div>
            </div>
            <Space size="small">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditDepartment(dept)}
                style={{ color: '#0693e3' }}
              />
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteDepartment(dept)}
                style={{ color: '#cf2e2e' }}
              />
            </Space>
          </div>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Manager Info */}
        <div style={{ marginBottom: '16px' }}>
          <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '8px' }}>
            Department Manager
          </Text>
          {manager ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar
                src={manager.avatar}
                icon={!manager.avatar && <UserOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #0693e3 0%, #0575E6 100%)',
                }}
              />
              <div>
                <Text
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#32373c',
                    display: 'block',
                  }}
                >
                  {manager.first_name} {manager.last_name}
                </Text>
                <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  {manager.designation_title}
                </Text>
              </div>
            </div>
          ) : (
            <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>
              {dept.manager_name || 'No manager assigned'}
            </Text>
          )}
        </div>

        {/* Department Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '12px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '8px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <TeamOutlined style={{ color: '#00d084', fontSize: '16px' }} />
              <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>Employees</Text>
            </div>
            <Text style={{ fontSize: '20px', fontWeight: 600, color: '#32373c' }}>
              {dept.employee_count}
            </Text>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <ApartmentOutlined style={{ color: '#0693e3', fontSize: '16px' }} />
              <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>Sub-Depts</Text>
            </div>
            <Text style={{ fontSize: '20px', fontWeight: 600, color: '#32373c' }}>
              {dept.sub_department_count || childDepartments.length}
            </Text>
          </div>
        </div>

        {/* Parent Department Tag */}
        {dept.parent_department && (
          <div style={{ marginTop: '12px' }}>
            <Tag
              style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                color: '#0693e3',
                border: '1px solid #0693e3',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
              }}
            >
              Under {dept.parent_department_name || departments.find(d => d.id === dept.parent_department)?.name}
            </Tag>
          </div>
        )}
      </Card>
    );
  };

  const HierarchyNode = ({ dept, level = 0 }: { dept: DepartmentListItem; level?: number }) => {
    const manager = getEmployeeById(dept.manager);
    const children = getChildDepartments(dept.id);

    return (
      <div style={{ marginLeft: level * 40 }}>
        <Card
          style={{
            marginBottom: '12px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            background: level === 0 ? 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' : 'white',
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: level === 0
                    ? 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)'
                    : 'linear-gradient(135deg, #0693e3 0%, #0575E6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                }}
              >
                <BankOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Title level={5} style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#32373c' }}>
                    {dept.name}
                  </Title>
                  <Tag color="blue" style={{ fontSize: '11px' }}>
                    {dept.employee_count} employees
                  </Tag>
                </div>
                <Text style={{ color: '#8c8c8c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {manager ? `Managed by ${manager.first_name} ${manager.last_name}` : dept.manager_name ? `Managed by ${dept.manager_name}` : 'No manager assigned'}
                </Text>
              </div>
            </div>
            <Space size="small">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditDepartment(dept)}
              />
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteDepartment(dept)}
                danger
              />
            </Space>
          </div>
        </Card>
        {children.map((child) => (
          <HierarchyNode key={child.id} dept={child} level={level + 1} />
        ))}
      </div>
    );
  };

  // Loading state
  if (deptsLoading && departments.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading departments..." />
      </div>
    );
  }

  // Error state
  if (deptsError) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Failed to Load Departments"
          description={deptsError}
          type="error"
          showIcon
          action={
            <Button onClick={() => { setDeptsError(null); fetchDepartmentsData(); }}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle={`${filteredDepartments.length} department${filteredDepartments.length !== 1 ? 's' : ''} in organization`}
        breadcrumbs={[
          { title: 'Human Resources' },
          { title: 'Departments' },
        ]}
        actions={
          <>
            <Button
              icon={<DownloadOutlined />}
              style={{ borderRadius: '8px' }}
            >
              Export
            </Button>
            <Button
              icon={<ApartmentOutlined />}
              onClick={() => setViewMode(viewMode === 'grid' ? 'hierarchy' : 'grid')}
              style={{ borderRadius: '8px' }}
            >
              {viewMode === 'grid' ? 'Hierarchy View' : 'Grid View'}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddDepartment}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
              }}
            >
              Add Department
            </Button>
          </>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Departments"
            value={totalDepartments}
            icon={<BankOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={<TeamOutlined />}
            iconBg="rgba(6, 147, 227, 0.1)"
            style={{ borderLeft: '4px solid #0693e3' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Avg. Team Size"
            value={avgEmployeesPerDept}
            icon={<UserOutlined />}
            iconBg="rgba(255, 105, 0, 0.1)"
            style={{ borderLeft: '4px solid #ff6900' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Largest Department"
            value={topDepartments[0]?.name.split(' ')[0] || 'N/A'}
            suffix={`(${topDepartments[0]?.employee_count || 0})`}
            icon={<ApartmentOutlined />}
            iconBg="rgba(155, 81, 224, 0.1)"
            style={{ borderLeft: '4px solid #9b51e0' }}
          />
        </Col>
      </Row>

      <FilterBar
        filters={filters}
        onSearch={setSearchTerm}
        onReset={handleReset}
      />

      {/* Department Grid or Hierarchy View */}
      {viewMode === 'grid' ? (
        <Row gutter={[20, 20]}>
          {filteredDepartments.map((dept) => (
            <Col key={dept.id} xs={24} sm={12} lg={8} xl={6}>
              <DepartmentCard dept={dept} />
            </Col>
          ))}
        </Row>
      ) : (
        <div>
          {rootDepartments.map((dept) => (
            <HierarchyNode key={dept.id} dept={dept} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredDepartments.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            marginTop: '20px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '36px',
              color: '#8c8c8c',
            }}
          >
            <BankOutlined />
          </div>
          <h3 style={{ color: '#32373c', marginBottom: '8px' }}>No departments found</h3>
          <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
            Try adjusting your search or add a new department
          </p>
          <Space size="middle">
            <Button onClick={handleReset}>Clear Search</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDepartment}>
              Add Department
            </Button>
          </Space>
        </div>
      )}

      {/* Add/Edit Department Modal */}
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#32373c' }}>
            {editingDepartment ? 'Edit Department' : 'Add New Department'}
          </div>
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingDepartment ? 'Update' : 'Create'}
        cancelText="Cancel"
        confirmLoading={deptsLoading}
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
            border: 'none',
            borderRadius: '8px',
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: '8px',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '20px' }}
          initialValues={{
            parentId: undefined,
          }}
        >
          <Form.Item
            name="code"
            label="Department Code"
            rules={[{ required: true, message: 'Please enter department code' }]}
            tooltip={!editingDepartment ? "Auto-generated code (you can modify if needed)" : undefined}
          >
            <Input
              placeholder="e.g., DEPT-001, HR, FIN, IT"
              style={{ borderRadius: '8px' }}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Department Name"
            rules={[{ required: true, message: 'Please enter department name' }]}
          >
            <Input
              placeholder="e.g., Human Resources"
              style={{ borderRadius: '8px' }}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter department description' }]}
          >
            <TextArea
              placeholder="Brief description of the department's role and responsibilities"
              rows={3}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="managerId"
            label="Department Manager"
            tooltip="Search and select any employee to be the department manager"
          >
            <Select
              placeholder="Search and select manager..."
              style={{ borderRadius: '8px' }}
              size="large"
              showSearch
              allowClear
              loading={empsLoading}
              filterOption={(input, option) => {
                const label = option?.label?.toString().toLowerCase() || '';
                return label.includes(input.toLowerCase());
              }}
              options={employees.map(emp => ({
                label: `${emp.first_name} ${emp.last_name} - ${emp.designation_title} (${emp.department_name})`,
                value: emp.id,
              }))}
              notFoundContent={empsLoading ? <Spin size="small" /> : 'No employees found'}
            />
          </Form.Item>

          <Form.Item
            name="parentId"
            label="Parent Department (Optional)"
          >
            <Select
              placeholder="Select parent department"
              style={{ borderRadius: '8px' }}
              size="large"
              allowClear
              options={departments
                .filter(dept => !editingDepartment || dept.id !== editingDepartment.id)
                .map(dept => ({
                  label: dept.name,
                  value: dept.id,
                }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
