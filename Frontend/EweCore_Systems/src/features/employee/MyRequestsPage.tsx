import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Space, Typography, Tabs, Button, Modal } from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingOutlined,
  InboxOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, StatCard, StatusTag } from '../../components/common';
import { useAuthStore } from '../../store/authStore';

const { Text } = Typography;

interface Request {
  id: string;
  type: 'leave' | 'expense' | 'petty-cash' | 'procurement';
  title: string;
  amount?: number;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  approver: string;
}

export const MyRequestsPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Mock requests data
  const mockRequests: Request[] = [
    {
      id: 'LR-001',
      type: 'leave',
      title: 'Annual Leave - 5 days',
      submittedDate: '05/09/2026',
      status: 'pending',
      approver: 'Collen Chingadayi',
    },
    {
      id: 'EXP-002',
      type: 'expense',
      title: 'Client Meeting Lunch',
      amount: 5600,
      submittedDate: '04/09/2026',
      status: 'approved',
      approver: 'David Kamau',
    },
    {
      id: 'PC-003',
      type: 'petty-cash',
      title: 'Office Supplies Purchase',
      amount: 15000,
      submittedDate: '03/09/2026',
      status: 'approved',
      approver: 'David Kamau',
    },
    {
      id: 'PR-004',
      type: 'procurement',
      title: 'New Laptop for Development',
      amount: 125000,
      submittedDate: '02/09/2026',
      status: 'pending',
      approver: 'Michael Otieno',
    },
    {
      id: 'EXP-005',
      type: 'expense',
      title: 'Taxi to Client Site',
      amount: 2800,
      submittedDate: '01/09/2026',
      status: 'rejected',
      approver: 'David Kamau',
    },
  ];

  // Filter requests by type
  const filterRequestsByType = (type?: string) => {
    if (!type || type === 'all') return mockRequests;
    return mockRequests.filter(r => r.type === type);
  };

  // Calculate statistics
  const stats = {
    total: mockRequests.length,
    pending: mockRequests.filter(r => r.status === 'pending').length,
    approved: mockRequests.filter(r => r.status === 'approved').length,
    rejected: mockRequests.filter(r => r.status === 'rejected').length,
  };

  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setDetailsModalVisible(true);
  };

  // Get icon for request type
  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return <CalendarOutlined style={{ color: '#667eea' }} />;
      case 'expense':
        return <DollarOutlined style={{ color: '#f093fb' }} />;
      case 'petty-cash':
        return <DollarOutlined style={{ color: '#4facfe' }} />;
      case 'procurement':
        return <ShoppingOutlined style={{ color: '#43e97b' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  // Table columns
  const columns: ColumnsType<Request> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text strong>{id}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          {getRequestTypeIcon(type)}
          <Tag color="blue">{type.toUpperCase().replace('-', ' ')}</Tag>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount?: number) =>
        amount ? (
          <Text strong style={{ color: '#00d084' }}>
            ZWG {amount.toLocaleString()}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedDate',
      key: 'submittedDate',
    },
    {
      title: 'Approver',
      dataIndex: 'approver',
      key: 'approver',
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
      render: (_: any, record: Request) => (
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

  const tabItems = [
    {
      key: 'all',
      label: (
        <Space>
          <InboxOutlined />
          All Requests ({mockRequests.length})
        </Space>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={filterRequestsByType('all')}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'leave',
      label: (
        <Space>
          <CalendarOutlined />
          Leave ({filterRequestsByType('leave').length})
        </Space>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={filterRequestsByType('leave')}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'expense',
      label: (
        <Space>
          <DollarOutlined />
          Expenses ({filterRequestsByType('expense').length})
        </Space>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={filterRequestsByType('expense')}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'petty-cash',
      label: (
        <Space>
          <DollarOutlined />
          Petty Cash ({filterRequestsByType('petty-cash').length})
        </Space>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={filterRequestsByType('petty-cash')}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'procurement',
      label: (
        <Space>
          <ShoppingOutlined />
          Procurement ({filterRequestsByType('procurement').length})
        </Space>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={filterRequestsByType('procurement')}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Requests"
        subtitle="Track all your submitted requests in one place"
        breadcrumbs={[
          { title: 'Employee' },
          { title: 'My Requests' },
        ]}
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Requests"
            value={stats.total}
            icon={<FileTextOutlined />}
            iconBg="#667eea"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<InboxOutlined />}
            iconBg="#ff6900"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<FileTextOutlined />}
            iconBg="#00d084"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={<FileTextOutlined />}
            iconBg="#cf2e2e"
          />
        </Col>
      </Row>

      {/* Quick Submit Actions */}
      <Card
        title="Quick Actions"
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Space wrap size="middle">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            Request Leave
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
            }}
          >
            Submit Expense
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
            }}
          >
            Request Petty Cash
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              border: 'none',
            }}
          >
            Submit Procurement
          </Button>
        </Space>
      </Card>

      {/* Requests Table with Tabs */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Request Details"
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
              <Text type="secondary">Type</Text>
              <div>
                <Space>
                  {getRequestTypeIcon(selectedRequest.type)}
                  <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                    {selectedRequest.type.toUpperCase().replace('-', ' ')}
                  </Tag>
                </Space>
              </div>
            </div>

            <div>
              <Text type="secondary">Description</Text>
              <div>
                <Text strong>{selectedRequest.title}</Text>
              </div>
            </div>

            {selectedRequest.amount && (
              <div>
                <Text type="secondary">Amount</Text>
                <div>
                  <Text strong style={{ fontSize: '18px', color: '#00d084' }}>
                    ZWG {selectedRequest.amount.toLocaleString()}
                  </Text>
                </div>
              </div>
            )}

            <div>
              <Text type="secondary">Submitted Date</Text>
              <div>
                <Text>{selectedRequest.submittedDate}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Approver</Text>
              <div>
                <Text>{selectedRequest.approver}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Status</Text>
              <div>
                <StatusTag status={selectedRequest.status} />
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};
