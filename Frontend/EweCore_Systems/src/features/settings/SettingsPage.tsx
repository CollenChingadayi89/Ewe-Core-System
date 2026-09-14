import { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Switch, Select, message, Space, Typography, Divider, Table, Tag, Alert } from 'antd';
import {
  LockOutlined,
  BellOutlined,
  EyeOutlined,
  SettingOutlined,
  SafetyOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Password } = Input;

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const [passwordForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [preferenceForm] = Form.useForm();
  const [privacyForm] = Form.useForm();
  const [appearanceForm] = Form.useForm();

  // Mock active sessions data
  const activeSessions: ActiveSession[] = [
    {
      id: '1',
      device: 'Windows PC - Chrome',
      location: 'Harare, Zimbabwe',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: '2',
      device: 'Mobile - Android',
      location: 'Harare, Zimbabwe',
      lastActive: '2 hours ago',
      current: false,
    },
  ];

  // Handle password change
  const handlePasswordChange = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('New passwords do not match!');
      return;
    }

    try {
      // Mock password change
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('Password changed successfully!');
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password');
    }
  };

  // Handle notification settings save
  const handleNotificationSave = async (values: any) => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(values));
      message.success('Notification settings saved!');
    } catch (error) {
      message.error('Failed to save settings');
    }
  };

  // Handle preference settings save
  const handlePreferenceSave = async (values: any) => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(values));
      message.success('Preferences saved successfully!');
    } catch (error) {
      message.error('Failed to save preferences');
    }
  };

  // Handle privacy settings save
  const handlePrivacySave = async (values: any) => {
    try {
      localStorage.setItem('privacySettings', JSON.stringify(values));
      message.success('Privacy settings saved!');
    } catch (error) {
      message.error('Failed to save settings');
    }
  };

  // Handle appearance settings save
  const handleAppearanceSave = async (values: any) => {
    try {
      localStorage.setItem('appearanceSettings', JSON.stringify(values));
      message.success('Appearance settings saved!');
    } catch (error) {
      message.error('Failed to save settings');
    }
  };

  // Handle download data
  const handleDownloadData = () => {
    message.info('Your data download request has been submitted. You will receive an email shortly.');
  };

  // Active sessions table columns
  const sessionColumns: ColumnsType<ActiveSession> = [
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (text: string, record: ActiveSession) => (
        <Space>
          <Text>{text}</Text>
          {record.current && <Tag color="green">Current</Tag>}
        </Space>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ActiveSession) => (
        !record.current && (
          <Button size="small" danger onClick={() => message.success('Session terminated')}>
            Terminate
          </Button>
        )
      ),
    },
  ];

  const tabItems = [
    {
      key: 'security',
      label: (
        <Space>
          <LockOutlined />
          Security
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Change Password */}
          <Card title="Change Password" bordered={false}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                label="Current Password"
                name="currentPassword"
                rules={[{ required: true, message: 'Please enter your current password' }]}
              >
                <Password size="large" placeholder="Enter current password" />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                ]}
              >
                <Password size="large" placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                rules={[{ required: true, message: 'Please confirm your new password' }]}
              >
                <Password size="large" placeholder="Confirm new password" />
              </Form.Item>

              <Alert
                message="Password Requirements"
                description="Your password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  border: 'none',
                }}
              >
                Change Password
              </Button>
            </Form>
          </Card>

          {/* Two-Factor Authentication */}
          <Card title="Two-Factor Authentication" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Text type="secondary">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </Text>
              <Space>
                <Switch defaultChecked={false} />
                <Text>Enable Two-Factor Authentication (2FA)</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                You'll receive a verification code via email when logging in from a new device.
              </Text>
            </Space>
          </Card>

          {/* Active Sessions */}
          <Card title="Active Sessions" bordered={false}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Manage devices where you're currently signed in.
            </Text>
            <Table
              columns={sessionColumns}
              dataSource={activeSessions}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'notifications',
      label: (
        <Space>
          <BellOutlined />
          Notifications
        </Space>
      ),
      children: (
        <Card bordered={false}>
          <Form
            form={notificationForm}
            layout="vertical"
            onFinish={handleNotificationSave}
            initialValues={{
              emailNotifications: true,
              systemAlerts: true,
              approvalNotifications: true,
              leaveNotifications: true,
              emailDigest: 'daily',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={24}>
              <div>
                <Title level={5}>Email Notifications</Title>
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Form.Item name="emailNotifications" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Space>
                      <Switch />
                      <Text>Receive email notifications</Text>
                    </Space>
                  </Form.Item>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginLeft: '44px' }}>
                    Get notified about important updates via email
                  </Text>
                </Space>
              </div>

              <Divider />

              <div>
                <Title level={5}>Notification Types</Title>
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Form.Item name="systemAlerts" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Space>
                      <Switch />
                      <Text>System alerts and announcements</Text>
                    </Space>
                  </Form.Item>

                  <Form.Item name="approvalNotifications" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Space>
                      <Switch />
                      <Text>Approval requests and updates</Text>
                    </Space>
                  </Form.Item>

                  <Form.Item name="leaveNotifications" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Space>
                      <Switch />
                      <Text>Leave requests and approvals</Text>
                    </Space>
                  </Form.Item>
                </Space>
              </div>

              <Divider />

              <div>
                <Title level={5}>Email Digest</Title>
                <Form.Item
                  label="Digest Frequency"
                  name="emailDigest"
                  tooltip="Choose how often you want to receive email summaries"
                >
                  <Select size="large" style={{ width: '200px' }}>
                    <Select.Option value="realtime">Real-time</Select.Option>
                    <Select.Option value="daily">Daily Digest</Select.Option>
                    <Select.Option value="weekly">Weekly Digest</Select.Option>
                    <Select.Option value="never">Never</Select.Option>
                  </Select>
                </Form.Item>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  border: 'none',
                }}
              >
                Save Notification Settings
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'preferences',
      label: (
        <Space>
          <SettingOutlined />
          Preferences
        </Space>
      ),
      children: (
        <Card bordered={false}>
          <Form
            form={preferenceForm}
            layout="vertical"
            onFinish={handlePreferenceSave}
            initialValues={{
              language: 'en',
              dateFormat: 'DD/MM/YYYY',
              timeFormat: '12',
              timezone: 'Africa/Harare',
              currency: 'ZWG',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={24}>
              <Form.Item
                label="Language"
                name="language"
                tooltip="Select your preferred language"
              >
                <Select size="large">
                  <Select.Option value="en">English</Select.Option>
                  <Select.Option value="sn">Shona</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Date Format"
                name="dateFormat"
                tooltip="Choose how dates are displayed throughout the system"
              >
                <Select size="large">
                  <Select.Option value="DD/MM/YYYY">DD/MM/YYYY (07/09/2026)</Select.Option>
                  <Select.Option value="MM/DD/YYYY">MM/DD/YYYY (09/07/2026)</Select.Option>
                  <Select.Option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-07)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Time Format"
                name="timeFormat"
                tooltip="Choose between 12-hour or 24-hour time display"
              >
                <Select size="large">
                  <Select.Option value="12">12-hour (2:30 PM)</Select.Option>
                  <Select.Option value="24">24-hour (14:30)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Timezone"
                name="timezone"
                tooltip="Select your local timezone"
              >
                <Select size="large" showSearch>
                  <Select.Option value="Africa/Harare">Africa/Harare (GMT+2)</Select.Option>
                  <Select.Option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</Select.Option>
                  <Select.Option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</Select.Option>
                  <Select.Option value="UTC">UTC (GMT+0)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Currency Display"
                name="currency"
                tooltip="Choose your preferred currency"
              >
                <Select size="large">
                  <Select.Option value="ZWG">ZWG (Zimbabwean Dollar)</Select.Option>
                  <Select.Option value="USD">USD (US Dollar)</Select.Option>
                  <Select.Option value="ZAR">ZAR (South African Rand)</Select.Option>
                </Select>
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  border: 'none',
                }}
              >
                Save Preferences
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'privacy',
      label: (
        <Space>
          <EyeOutlined />
          Privacy
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card title="Profile Visibility" bordered={false}>
            <Form
              form={privacyForm}
              layout="vertical"
              onFinish={handlePrivacySave}
              initialValues={{
                showEmail: true,
                showPhone: true,
                showActivityStatus: true,
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Form.Item name="showEmail" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Space>
                    <Switch />
                    <div>
                      <Text>Show email to colleagues</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Allow other employees to see your email address
                      </Text>
                    </div>
                  </Space>
                </Form.Item>

                <Form.Item name="showPhone" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Space>
                    <Switch />
                    <div>
                      <Text>Show phone number to colleagues</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Allow other employees to see your phone number
                      </Text>
                    </div>
                  </Space>
                </Form.Item>

                <Form.Item name="showActivityStatus" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Space>
                    <Switch />
                    <div>
                      <Text>Show activity status</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Let others see when you're online
                      </Text>
                    </div>
                  </Space>
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    marginTop: '16px',
                    background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                    border: 'none',
                  }}
                >
                  Save Privacy Settings
                </Button>
              </Space>
            </Form>
          </Card>

          <Card title="Data Management" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text strong>Download Your Data</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Download a copy of all your personal data stored in the system
                </Text>
              </div>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadData}
              >
                Request Data Download
              </Button>

              <Divider />

              <div>
                <Text strong>Activity Log</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  View your recent activity and login history
                </Text>
              </div>
              <Button>View Activity Log</Button>
            </Space>
          </Card>
        </Space>
      ),
    },
    {
      key: 'appearance',
      label: (
        <Space>
          <SafetyOutlined />
          Appearance
        </Space>
      ),
      children: (
        <Card bordered={false}>
          <Form
            form={appearanceForm}
            layout="vertical"
            onFinish={handleAppearanceSave}
            initialValues={{
              sidebarCollapsed: false,
              compactView: false,
              colorScheme: 'light',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={24}>
              <div>
                <Title level={5}>Layout Options</Title>
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Form.Item name="sidebarCollapsed" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Space>
                      <Switch />
                      <div>
                        <Text>Sidebar collapsed by default</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Start with a collapsed sidebar on login
                        </Text>
                      </div>
                    </Space>
                  </Form.Item>

                  <Form.Item name="compactView" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Space>
                      <Switch />
                      <div>
                        <Text>Compact view</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Reduce padding and spacing for a more compact interface
                        </Text>
                      </div>
                    </Space>
                  </Form.Item>
                </Space>
              </div>

              <Divider />

              <div>
                <Title level={5}>Color Scheme</Title>
                <Form.Item name="colorScheme" style={{ marginBottom: 0 }}>
                  <Select size="large" style={{ width: '200px' }}>
                    <Select.Option value="light">Light Mode</Select.Option>
                    <Select.Option value="dark">Dark Mode (Coming Soon)</Select.Option>
                    <Select.Option value="auto">Auto (System)</Select.Option>
                  </Select>
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                  Choose your preferred color scheme
                </Text>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  border: 'none',
                }}
              >
                Save Appearance Settings
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences"
        breadcrumbs={[{ title: 'Settings' }]}
      />

      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Tabs
          defaultActiveKey="security"
          items={tabItems}
          tabPosition="left"
          style={{ minHeight: '600px' }}
        />
      </Card>
    </div>
  );
};
