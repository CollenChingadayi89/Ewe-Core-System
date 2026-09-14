import { useState } from 'react';
import { Card, Row, Col, Avatar, Typography, Space, Tag, Descriptions, Button, Modal, Form, Input, Upload, message, Divider } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { PageHeader, StatCard } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  if (!user) return null;

  // Calculate years of service
  const joinDate = dayjs(user.joinDate, 'DD/MM/YYYY');
  const yearsOfService = dayjs().diff(joinDate, 'year', true).toFixed(1);

  // Mock data for additional details
  const additionalDetails = {
    employeeId: user.id,
    officeLocation: 'Head Office, Harare',
    workingHours: '8:00 AM - 5:00 PM',
    contractType: 'Permanent',
    lastLogin: 'Today at 8:30 AM',
  };

  const handleEditProfile = () => {
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: user.position,
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async (values: any) => {
    try {
      await updateUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        position: values.position,
      });
      message.success('Profile updated successfully!');
      setEditModalVisible(false);
    } catch (error) {
      message.error('Failed to update profile');
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      employee: 'Employee',
      manager: 'Manager',
      hr_manager: 'HR Manager',
      finance_manager: 'Finance Manager',
      ceo: 'Chief Executive Officer',
      admin: 'Administrator',
    };
    return roleMap[role] || role;
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and manage your personal information"
        breadcrumbs={[{ title: 'Profile' }]}
        actions={
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEditProfile}
            style={{
              background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            Edit Profile
          </Button>
        }
      />

      {/* Profile Header Card */}
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Row align="middle" gutter={24}>
          <Col>
            <Avatar
              size={100}
              icon={<UserOutlined />}
              src={user.avatar}
              style={{
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: '4px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            />
          </Col>
          <Col flex={1}>
            <Space direction="vertical" size={4}>
              <Title level={2} style={{ margin: 0, color: '#fff' }}>
                {user.name}
              </Title>
              <Text style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
                {user.position} • {user.department}
              </Text>
              <Space size="large" style={{ marginTop: '8px' }}>
                <Space style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <MailOutlined />
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{user.email}</Text>
                </Space>
                {user.phone && (
                  <Space style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <PhoneOutlined />
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{user.phone}</Text>
                  </Space>
                )}
              </Space>
              <div style={{ marginTop: '12px' }}>
                <Tag
                  color={user.status === 'active' ? 'success' : 'default'}
                  style={{
                    fontSize: '13px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                  }}
                >
                  {user.status === 'active' ? 'Active' : 'Inactive'}
                </Tag>
                <Tag
                  color="blue"
                  style={{
                    fontSize: '13px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                  }}
                >
                  {getRoleDisplayName(user.role)}
                </Tag>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Years of Service"
            value={yearsOfService}
            icon={<ClockCircleOutlined />}
            iconBg="#667eea"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Leave Days Used"
            value="12 / 30"
            icon={<CalendarOutlined />}
            iconBg="#f093fb"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Approvals"
            value="3"
            icon={<CheckCircleOutlined />}
            iconBg="#4facfe"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Team Members"
            value={user.role === 'manager' || user.role === 'hr_manager' ? '8' : '-'}
            icon={<TeamOutlined />}
            iconBg="#43e97b"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Employment Details */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: '#00d084' }} />
                <Text strong>Employment Details</Text>
              </Space>
            }
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Employee ID">
                <Text strong>{additionalDetails.employeeId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Position">
                {user.position}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {user.department}
              </Descriptions.Item>
              <Descriptions.Item label="Reports To">
                {user.reportsTo || 'CEO'}
              </Descriptions.Item>
              <Descriptions.Item label="Join Date">
                <Space>
                  <CalendarOutlined />
                  {user.joinDate}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Contract Type">
                {additionalDetails.contractType}
              </Descriptions.Item>
              <Descriptions.Item label="Office Location">
                <Space>
                  <EnvironmentOutlined />
                  {additionalDetails.officeLocation}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Working Hours">
                {additionalDetails.workingHours}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Contact Information & Activity */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* Contact Information */}
            <Card
              title={
                <Space>
                  <PhoneOutlined style={{ color: '#00d084' }} />
                  <Text strong>Contact Information</Text>
                </Space>
              }
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div>
                  <Text type="secondary">Email Address</Text>
                  <div>
                    <Space>
                      <MailOutlined style={{ color: '#00d084' }} />
                      <Text strong>{user.email}</Text>
                    </Space>
                  </div>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text type="secondary">Phone Number</Text>
                  <div>
                    <Space>
                      <PhoneOutlined style={{ color: '#00d084' }} />
                      <Text strong>{user.phone || 'Not provided'}</Text>
                    </Space>
                  </div>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text type="secondary">Office Location</Text>
                  <div>
                    <Space>
                      <EnvironmentOutlined style={{ color: '#00d084' }} />
                      <Text strong>{additionalDetails.officeLocation}</Text>
                    </Space>
                  </div>
                </div>
              </Space>
            </Card>

            {/* Recent Activity */}
            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#00d084' }} />
                  <Text strong>Recent Activity</Text>
                </Space>
              }
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <div>
                  <Text type="secondary">Last Login</Text>
                  <div>
                    <Text strong>{additionalDetails.lastLogin}</Text>
                  </div>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text type="secondary">Account Status</Text>
                  <div>
                    <Tag color="success">Active and Verified</Tag>
                  </div>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text type="secondary">Profile Completion</Text>
                  <div>
                    <Space>
                      <Text strong>85%</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        (Add phone number to complete)
                      </Text>
                    </Space>
                  </div>
                </div>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
        >
          <Form.Item
            label="Profile Picture"
            name="avatar"
            tooltip="Upload a profile picture (mock - not persisted)"
          >
            <Upload
              maxCount={1}
              accept="image/*"
              beforeUpload={() => false}
              listType="picture-card"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input size="large" placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input size="large" placeholder="your.email@ewesacco.org" />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input size="large" placeholder="+263 77 123 4567" />
          </Form.Item>

          <Form.Item
            label="Position"
            name="position"
            rules={[{ required: true, message: 'Please enter your position' }]}
          >
            <Input size="large" placeholder="Your job title" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  border: 'none',
                }}
              >
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
