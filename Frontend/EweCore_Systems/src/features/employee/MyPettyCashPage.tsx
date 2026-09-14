import { useState } from 'react';
import { Card, Row, Col, Button, Table, Modal, Form, Input, InputNumber, DatePicker, message, Space, Typography } from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, StatCard, StatusTag } from '../../components/common';
import { useAuthStore } from '../../store/authStore';

const { TextArea } = Input;
const { Text } = Typography;

interface PettyCashRequest {
  id: string;
  purpose: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  approvedBy?: string;
  disbursedDate?: string;
}

export const MyPettyCashPage = () => {
  const { user } = useAuthStore();
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PettyCashRequest | null>(null);
  const [form] = Form.useForm();

  // Mock petty cash requests
  const mockRequests: PettyCashRequest[] = [
    {
      id: 'PC-001',
      purpose: 'Office Supplies Purchase',
      amount: 15000,
      requestDate: '05/09/2026',
      status: 'pending',
    },
    {
      id: 'PC-002',
      purpose: 'Team Refreshments',
      amount: 8500,
      requestDate: '03/09/2026',
      status: 'approved',
      approvedBy: 'David Kamau',
    },
    {
      id: 'PC-003',
      purpose: 'Courier Services',
      amount: 3200,
      requestDate: '01/09/2026',
      status: 'disbursed',
      approvedBy: 'David Kamau',
      disbursedDate: '02/09/2026',
    },
    {
      id: 'PC-004',
      purpose: 'Printing and Photocopying',
      amount: 5400,
      requestDate: '28/08/2026',
      status: 'disbursed',
      approvedBy: 'David Kamau',
      disbursedDate: '29/08/2026',
    },
  ];

  // Calculate statistics
  const stats = {
    total: mockRequests.reduce((sum, r) => sum + r.amount, 0),
    pending: mockRequests.filter(r => r.status === 'pending').length,
    approved: mockRequests.filter(r => r.status === 'approved').length,
    disbursed: mockRequests.filter(r => r.status === 'disbursed').reduce((sum, r) => sum + r.amount, 0),
  };

  const handleSubmitRequest = async (values: any) => {
    try {
      // Mock submission
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('Petty cash request submitted successfully!');
      setRequestModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit request');
    }
  };

  const handleViewDetails = (request: PettyCashRequest) => {
    setSelectedRequest(request);
    setDetailsModalVisible(true);
  };

  // Table columns
  const columns: ColumnsType<PettyCashRequest> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text strong>{id}</Text>,
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#00d084' }}>
          ZWG {amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PettyCashRequest) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Petty Cash"
        subtitle="Request and track petty cash disbursements"
        breadcrumbs={[
          { title: 'Employee' },
          { title: 'My Petty Cash' },
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
            New Request
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Requested"
            value={`ZWG ${stats.total.toLocaleString()}`}
            icon={<DollarOutlined />}
            iconBg="#667eea"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Requests"
            value={stats.pending}
            icon={<ClockCircleOutlined />}
            iconBg="#ff6900"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircleOutlined />}
            iconBg="#00d084"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Disbursed"
            value={`ZWG ${stats.disbursed.toLocaleString()}`}
            icon={<FileTextOutlined />}
            iconBg="#4facfe"
          />
        </Col>
      </Row>

      {/* Requests Table */}
      <Card
        title="My Petty Cash Requests"
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Table
          columns={columns}
          dataSource={mockRequests}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Request Modal */}
      <Modal
        title="New Petty Cash Request"
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
            label="Purpose"
            name="purpose"
            rules={[{ required: true, message: 'Please enter the purpose' }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe the purpose of this petty cash request..."
              maxLength={300}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Amount (ZWG)"
            name="amount"
            rules={[
              { required: true, message: 'Please enter the amount' },
              { type: 'number', min: 1, message: 'Amount must be greater than 0' },
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              min={0}
              step={100}
              formatter={value => `ZWG ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/ZWG\s?|(,*)/g, '') as any}
            />
          </Form.Item>

          <Form.Item
            label="Expected Return Date"
            name="expectedReturnDate"
            rules={[{ required: true, message: 'Please select expected return date' }]}
            tooltip="Date when you expect to return with receipts and reconciliation"
          >
            <DatePicker
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            label="Additional Notes"
            name="notes"
          >
            <TextArea
              rows={2}
              placeholder="Any additional information..."
              maxLength={200}
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
        title="Petty Cash Request Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text type="secondary">Request ID</Text>
              <div>
                <Text strong style={{ fontSize: '16px' }}>{selectedRequest.id}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Purpose</Text>
              <div>
                <Text>{selectedRequest.purpose}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Amount</Text>
              <div>
                <Text strong style={{ fontSize: '20px', color: '#00d084' }}>
                  ZWG {selectedRequest.amount.toLocaleString()}
                </Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Request Date</Text>
              <div>
                <Text>{selectedRequest.requestDate}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Status</Text>
              <div>
                <StatusTag status={selectedRequest.status} />
              </div>
            </div>

            {selectedRequest.approvedBy && (
              <div>
                <Text type="secondary">Approved By</Text>
                <div>
                  <Text>{selectedRequest.approvedBy}</Text>
                </div>
              </div>
            )}

            {selectedRequest.disbursedDate && (
              <div>
                <Text type="secondary">Disbursed Date</Text>
                <div>
                  <Text>{selectedRequest.disbursedDate}</Text>
                </div>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};
