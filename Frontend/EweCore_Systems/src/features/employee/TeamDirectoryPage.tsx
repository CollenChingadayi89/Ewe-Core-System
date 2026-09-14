import { useState } from 'react';
import { Card, Row, Col, Input, Select, Avatar, Space, Typography, Divider, Tag } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../components/common';
import { mockEmployees } from '../../mock/employees';

const { Text, Title } = Typography;
const { Search } = Input;

export const TeamDirectoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Filter employees
  const filteredEmployees = mockEmployees.filter(emp => {
    const matchesSearch = !searchTerm ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;

    return matchesSearch && matchesDepartment && emp.status === 'active';
  });

  // Get unique departments
  const departments = Array.from(new Set(mockEmployees.map(e => e.department))).sort();

  return (
    <div>
      <PageHeader
        title="Team Directory"
        subtitle="Browse and connect with your colleagues"
        breadcrumbs={[
          { title: 'Employee' },
          { title: 'Team Directory' },
        ]}
      />

      {/* Filters */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Search
              placeholder="Search by name, email, or position..."
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="Filter by department"
              value={departmentFilter}
              onChange={setDepartmentFilter}
            >
              <Select.Option value="all">All Departments</Select.Option>
              {departments.map(dept => (
                <Select.Option key={dept} value={dept}>{dept}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <TeamOutlined style={{ fontSize: '32px', color: '#00d084' }} />
          </Col>
          <Col>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Total Employees</Text>
              <Title level={3} style={{ margin: 0 }}>{filteredEmployees.length}</Title>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Employee Cards */}
      <Row gutter={[16, 16]}>
        {filteredEmployees.map(employee => (
          <Col key={employee.id} xs={24} sm={12} lg={8} xl={6}>
            <Card
              hoverable
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.3s',
              }}
              styles={{
                body: { padding: '20px' },
              }}
            >
              <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }} size="small">
                <Avatar
                  size={80}
                  icon={<UserOutlined />}
                  src={employee.avatar}
                  style={{
                    background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                    margin: '0 auto',
                  }}
                />

                <div>
                  <Title level={5} style={{ margin: '8px 0 4px 0' }}>
                    {employee.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {employee.position}
                  </Text>
                </div>

                <Tag color="blue" style={{ margin: '4px 0' }}>
                  {employee.department}
                </Tag>

                <Divider style={{ margin: '12px 0' }} />

                <Space direction="vertical" style={{ width: '100%', textAlign: 'left' }} size={8}>
                  <Space style={{ width: '100%' }}>
                    <MailOutlined style={{ color: '#00d084', fontSize: '14px' }} />
                    <Text
                      style={{ fontSize: '12px' }}
                      ellipsis={{ tooltip: employee.email }}
                    >
                      {employee.email}
                    </Text>
                  </Space>

                  {employee.phone && (
                    <Space style={{ width: '100%' }}>
                      <PhoneOutlined style={{ color: '#00d084', fontSize: '14px' }} />
                      <Text style={{ fontSize: '12px' }}>{employee.phone}</Text>
                    </Space>
                  )}

                  {employee.reportsTo && (
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        Reports to: {employee.reportsTo}
                      </Text>
                    </div>
                  )}
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredEmployees.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <TeamOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <div>
            <Text type="secondary">No employees found matching your search criteria</Text>
          </div>
        </Card>
      )}
    </div>
  );
};
