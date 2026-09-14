import { useState } from 'react';
import { Row, Col, Button, Card, Avatar, Typography, Space, Modal, Form, Input, Select, Divider, Tag } from 'antd';
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
import { mockDepartments, mockEmployees, getEmployeeById } from '../../mock/employees';
import type { Department } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const DepartmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>('grid');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form] = Form.useForm();

  // Calculate statistics
  const totalDepartments = mockDepartments.length;
  const totalEmployees = mockEmployees.length;
  const avgEmployeesPerDept = Math.round(totalEmployees / totalDepartments);
  const topDepartments = [...mockDepartments].sort((a, b) => b.employeeCount - a.employeeCount);

  // Filter departments based on search
  const filteredDepartments = mockDepartments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get department hierarchy
  const rootDepartments = filteredDepartments.filter(dept => !dept.parentId);
  const getChildDepartments = (parentId: string) => {
    return filteredDepartments.filter(dept => dept.parentId === parentId);
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

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    form.setFieldsValue({
      name: dept.name,
      description: dept.description,
      managerId: dept.managerId,
      parentId: dept.parentId,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      console.log('Department form values:', values);
      // In a real app, this would call an API to save the department
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDepartment(null);
  };

  const handleDeleteDepartment = (dept: Department) => {
    Modal.confirm({
      title: 'Delete Department',
      content: `Are you sure you want to delete ${dept.name}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        console.log('Deleting department:', dept.id);
        // In a real app, this would call an API to delete the department
      },
    });
  };

  const DepartmentCard = ({ dept }: { dept: Department }) => {
    const manager = getEmployeeById(dept.managerId);
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
                  {manager.name}
                </Text>
                <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  {manager.position}
                </Text>
              </div>
            </div>
          ) : (
            <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>No manager assigned</Text>
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
              {dept.employeeCount}
            </Text>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <ApartmentOutlined style={{ color: '#0693e3', fontSize: '16px' }} />
              <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>Sub-Depts</Text>
            </div>
            <Text style={{ fontSize: '20px', fontWeight: 600, color: '#32373c' }}>
              {childDepartments.length}
            </Text>
          </div>
        </div>

        {/* Parent Department Tag */}
        {dept.parentId && (
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
              Under {mockDepartments.find(d => d.id === dept.parentId)?.name}
            </Tag>
          </div>
        )}
      </Card>
    );
  };

  const HierarchyNode = ({ dept, level = 0 }: { dept: Department; level?: number }) => {
    const manager = getEmployeeById(dept.managerId);
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
                    {dept.employeeCount} employees
                  </Tag>
                </div>
                <Text style={{ color: '#8c8c8c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {manager ? `Managed by ${manager.name}` : 'No manager assigned'}
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
            suffix={`(${topDepartments[0]?.employeeCount || 0})`}
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
            rules={[{ required: true, message: 'Please select a manager' }]}
          >
            <Select
              placeholder="Select manager"
              style={{ borderRadius: '8px' }}
              size="large"
              showSearch
              optionFilterProp="children"
              options={mockEmployees
                .filter(emp => ['manager', 'hr_manager', 'finance_manager', 'ceo'].includes(emp.role))
                .map(emp => ({
                  label: `${emp.name} - ${emp.position}`,
                  value: emp.id,
                }))}
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
              options={mockDepartments
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
