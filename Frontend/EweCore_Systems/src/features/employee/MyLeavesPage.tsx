import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Tag, Modal, Form, Select, DatePicker, Input, message, Space, Typography, Divider } from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, StatCard, StatusTag } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import type { LeaveRequest, LeaveType } from '../../types';
import employeeApi from '../../services/api/employeeApi';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

export const MyLeavesPage = () => {
  const { user } = useAuthStore();

  // Local state instead of Zustand
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [myBalances, setMyBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [form] = Form.useForm();

  // Fetch functions
  const fetchMyLeaves = async (userId: string) => {
    setLoading(true);
    try {
      const response = await employeeApi.leaveRequests.list({ employee: userId });
      setMyRequests(response.results || []);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (data: any) => {
    try {
      await employeeApi.leaveRequests.create(data);
      message.success('Leave request submitted successfully');
      if (user) fetchMyLeaves(user.id);
    } catch (error: any) {
      message.error(error?.response?.data?.detail || 'Failed to submit request');
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyLeaves(user.id);
    }
  }, [user]);

  // Calculate statistics
  const stats = {
    annualBalance: myBalances.find(b => b.leaveType === 'Annual Leave')?.remaining || 0,
    sickBalance: myBalances.find(b => b.leaveType === 'Sick Leave')?.remaining || 0,
    usedThisYear: myBalances.reduce((sum, b) => sum + b.used, 0),
    pendingRequests: myRequests.filter(r => r.status === 'pending').length,
  };

  const handleSubmitRequest = async (values: any) => {
    if (!user) return;

    try {
      const startDate = values.dateRange[0];
      const endDate = values.dateRange[1];
      const days = endDate.diff(startDate, 'day') + 1;

      await submitRequest(user.id, {
        leaveType: values.leaveType,
        startDate: startDate.format('DD/MM/YYYY'),
        endDate: endDate.format('DD/MM/YYYY'),
        days,
        reason: values.reason,
        attachments: values.attachments?.fileList?.map((file: any) => file.name) || [],
      });

      message.success('Leave request submitted successfully!');
      setRequestModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit leave request');
    }
  };

  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setDetailsModalVisible(true);
  };

  const handleCancelRequest = async (leaveId: string) => {
    try {
      // Mock cancel - in real app, call API
      message.success('Leave request cancelled');
    } catch (error) {
      message.error('Failed to cancel request');
    }
  };

  // Table columns
  const columns: ColumnsType<LeaveRequest> = [
    {
      title: 'Leave Type',
      dataIndex: ['data', 'leaveType'],
      key: 'leaveType',
      render: (type: string) => (
        <Tag color="blue">{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>
      ),
    },
    {
      title: 'Start Date',
      dataIndex: ['data', 'startDate'],
      key: 'startDate',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{date}</Text>
        </Space>
      ),
    },
    {
      title: 'End Date',
      dataIndex: ['data', 'endDate'],
      key: 'endDate',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{date}</Text>
        </Space>
      ),
    },
    {
      title: 'Days',
      dataIndex: ['data', 'days'],
      key: 'days',
      render: (days: number) => <Text strong>{days} day{days !== 1 ? 's' : ''}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LeaveRequest) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelRequest(record.id)}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Leaves"
        subtitle="Manage your leave requests and balance"
        breadcrumbs={[
          { title: 'Employee' },
          { title: 'My Leaves' },
        ]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setRequestModalVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            Request Leave
          </Button>
        }
      />

      {/* Leave Balance Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Annual Leave Balance"
            value={stats.annualBalance}
            icon={<CalendarOutlined />}
            iconBg="#667eea"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Sick Leave Balance"
            value={stats.sickBalance}
            icon={<ClockCircleOutlined />}
            iconBg="#f093fb"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Used This Year"
            value={stats.usedThisYear}
            icon={<CheckCircleOutlined />}
            iconBg="#4facfe"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={<ClockCircleOutlined />}
            iconBg="#43e97b"
          />
        </Col>
      </Row>

      {/* Leave Balance Details */}
      <Card
        title="Leave Balance Details"
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Row gutter={[16, 16]}>
          {myBalances.map((balance, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '16px' }}>{balance.leaveType}</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Allocated:</Text>
                    <Text strong>{balance.allocated} days</Text>
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Used:</Text>
                    <Text>{balance.used} days</Text>
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Remaining:</Text>
                    <Text strong style={{ color: '#00d084', fontSize: '18px' }}>
                      {balance.remaining} days
                    </Text>
                  </Space>
                  {balance.carryForward > 0 && (
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text type="secondary">Carry Forward:</Text>
                      <Tag color="blue">{balance.carryForward} days</Tag>
                    </Space>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* My Leave Requests */}
      <Card
        title="My Leave Requests"
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Table
          columns={columns}
          dataSource={myRequests}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Request Leave Modal */}
      <Modal
        title="Request Leave"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRequest}
        >
          <Form.Item
            label="Leave Type"
            name="leaveType"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select size="large" placeholder="Select leave type">
              <Select.Option value="annual">Annual Leave</Select.Option>
              <Select.Option value="sick">Sick Leave</Select.Option>
              <Select.Option value="casual">Casual Leave</Select.Option>
              <Select.Option value="maternity">Maternity Leave</Select.Option>
              <Select.Option value="paternity">Paternity Leave</Select.Option>
              <Select.Option value="compassionate">Compassionate Leave</Select.Option>
              <Select.Option value="unpaid">Unpaid Leave</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Leave Period"
            name="dateRange"
            rules={[{ required: true, message: 'Please select leave dates' }]}
          >
            <RangePicker
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <TextArea
              rows={4}
              placeholder="Please provide a reason for your leave request..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setRequestModalVisible(false);
                form.resetFields();
              }}>
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
                Submit Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title="Leave Request Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedLeave && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text type="secondary">Leave Type</Text>
              <div>
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {selectedLeave.data.leaveType.charAt(0).toUpperCase() + selectedLeave.data.leaveType.slice(1)}
                </Tag>
              </div>
            </div>

            <div>
              <Text type="secondary">Period</Text>
              <div>
                <Text strong style={{ fontSize: '16px' }}>
                  {selectedLeave.data.startDate} - {selectedLeave.data.endDate}
                </Text>
                <Text type="secondary" style={{ marginLeft: '12px' }}>
                  ({selectedLeave.data.days} days)
                </Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Status</Text>
              <div>
                <StatusTag status={selectedLeave.status} />
              </div>
            </div>

            <div>
              <Text type="secondary">Reason</Text>
              <div>
                <Text>{selectedLeave.data.reason}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Submitted Date</Text>
              <div>
                <Text>{selectedLeave.createdAt}</Text>
              </div>
            </div>

            {selectedLeave.status === 'pending' && (
              <Button
                danger
                block
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  handleCancelRequest(selectedLeave.id);
                  setDetailsModalVisible(false);
                }}
              >
                Cancel This Request
              </Button>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};
