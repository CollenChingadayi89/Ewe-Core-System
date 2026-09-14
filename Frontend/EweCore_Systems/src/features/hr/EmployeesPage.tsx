import { useState } from 'react';
import { Row, Col, Button, Input, Select, Modal, Form, DatePicker, message } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader, EmployeeCard, FilterBar } from '../../components/common';
import type { Filter } from '../../components/common';
import { mockEmployeesWithProductivity } from '../../mock/employees';

export const EmployeesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Filter employees based on search and filters
  const filteredEmployees = mockEmployeesWithProductivity.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || emp.department === departmentFilter;
    const matchesStatus = !statusFilter || emp.employmentStatus === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search employees by name or position...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 300,
    },
    {
      type: 'select',
      label: 'Department',
      placeholder: 'All Departments',
      onChange: setDepartmentFilter,
      value: departmentFilter,
      width: 200,
      options: [
        { label: 'Executive', value: 'Executive' },
        { label: 'Human Resources', value: 'Human Resources' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Operations', value: 'Operations' },
        { label: 'IT', value: 'IT' },
        { label: 'Executive', value: 'Executive' },
        { label: 'Compliance & Risk', value: 'Compliance & Risk' },
      ],
    },
    {
      type: 'select',
      label: 'Employment Status',
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 180,
      options: [
        { label: 'Permanent', value: 'Permanent' },
        { label: 'Contract', value: 'Contract' },
        { label: 'Probation', value: 'Probation' },
        { label: 'Intern', value: 'Intern' },
      ],
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setDepartmentFilter(undefined);
    setStatusFilter(undefined);
  };

  const handleAddEmployee = async (values: any) => {
    try {
      console.log('New employee data:', values);
      // Here you would typically send data to your API
      message.success('Employee added successfully!');
      setAddModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to add employee');
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${filteredEmployees.length} employee${filteredEmployees.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[
          { title: 'Human Resources' },
          { title: 'Employees' },
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
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
              }}
            >
              Add Employee
            </Button>
          </>
        }
      />

      <FilterBar
        filters={filters}
        onSearch={setSearchTerm}
        onReset={handleReset}
      />

      {/* Employee Grid */}
      <Row gutter={[20, 20]}>
        {filteredEmployees.map((employee) => (
          <Col key={employee.id} xs={24} sm={12} md={8} lg={6} xl={6}>
            <EmployeeCard
              id={employee.id}
              name={employee.name}
              role={employee.position}
              department={employee.department}
              email={employee.email}
              phone={employee.phone}
              avatar={employee.avatar}
              projects={employee.projects}
              done={employee.done}
              progress={employee.progress}
              productivity={employee.productivity}
              onClick={() => navigate(`/hr/employees/${employee.id}`)}
            />
          </Col>
        ))}
      </Row>

      {filteredEmployees.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            marginTop: '20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ color: '#32373c', marginBottom: '8px' }}>No employees found</h3>
          <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
            Try adjusting your search or filters
          </p>
          <Button onClick={handleReset}>Clear Filters</Button>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        title="Add New Employee"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        width={900}
        okText="Add Employee"
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          onFinish={handleAddEmployee}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="email@ewesacco.org" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="+263 700 000 000" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  <Select.Option value="Executive">Executive</Select.Option>
                  <Select.Option value="Human Resources">Human Resources</Select.Option>
                  <Select.Option value="Finance">Finance</Select.Option>
                  <Select.Option value="Operations">Operations</Select.Option>
                  <Select.Option value="IT">IT</Select.Option>
                  <Select.Option value="Compliance & Risk">Compliance & Risk</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Position"
                name="position"
                rules={[{ required: true, message: 'Please enter position' }]}
              >
                <Input placeholder="Job title" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Employment Status"
                name="employmentStatus"
                rules={[{ required: true, message: 'Please select employment status' }]}
              >
                <Select placeholder="Select status">
                  <Select.Option value="Permanent">Permanent</Select.Option>
                  <Select.Option value="Contract">Contract</Select.Option>
                  <Select.Option value="Probation">Probation</Select.Option>
                  <Select.Option value="Intern">Intern</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select system role">
                  <Select.Option value="employee">Employee</Select.Option>
                  <Select.Option value="manager">Manager</Select.Option>
                  <Select.Option value="hr_manager">HR Manager</Select.Option>
                  <Select.Option value="finance_manager">Finance Manager</Select.Option>
                  <Select.Option value="admin">Admin</Select.Option>
                  <Select.Option value="ceo">CEO</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Join Date"
                name="joinDate"
                rules={[{ required: true, message: 'Please select join date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Reports To"
                name="reportsTo"
              >
                <Select placeholder="Select manager" allowClear>
                  {mockEmployeesWithProductivity
                    .filter((emp) => emp.role !== 'employee')
                    .map((emp) => (
                      <Select.Option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Salary"
                name="salary"
              >
                <Input type="number" placeholder="Monthly salary" prefix="ZWG" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="ID Number"
                name="idNumber"
                rules={[{ required: true, message: 'Please enter ID number' }]}
              >
                <Input placeholder="National ID number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Address"
                name="address"
              >
                <Input.TextArea rows={2} placeholder="Residential address" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Emergency Contact"
                name="emergencyContact"
              >
                <Input placeholder="Emergency contact number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Bank Account"
                name="bankAccount"
              >
                <Input placeholder="Bank account number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Bank Name"
                name="bankName"
              >
                <Input placeholder="Bank name" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
