import { useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Drawer,
  Descriptions,
  Timeline,
  Modal,
  Form,
  message,
  Typography,
  Badge,
  Avatar,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../../store/authStore';
import { useApprovalStore } from '../../store/approvalStore';
import type { ApprovalRequest } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ApprovalsPage = () => {
  const { user } = useAuthStore();
  const { requests, approveRequest, rejectRequest } = useApprovalStore();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form] = Form.useForm();

  // Safely access requests with fallback
  const approvalRequests = requests || [];

  // Filter approvals that need my attention (where I'm the current approver)
  const pendingApprovals = approvalRequests.filter((req) => {
    const currentStep = req.approvalChain.find((step) => step.status === 'pending');
    return currentStep?.approverId === user?.id && req.status === 'pending';
  });

  // Filter my own requests
  const myRequests = approvalRequests.filter((req) => req.requestorId === user?.id);

  // Statistics
  const stats = {
    pendingCount: pendingApprovals.length,
    myPendingRequests: myRequests.filter((r) => r.status === 'pending').length,
    myApprovedRequests: myRequests.filter((r) => r.status === 'approved').length,
    myRejectedRequests: myRequests.filter((r) => r.status === 'rejected').length,
  };

  const handleViewDetails = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setDrawerVisible(true);
  };

  const handleAction = (request: ApprovalRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionModalVisible(true);
  };

  const handleSubmitAction = async (values: { comments?: string }) => {
    if (!selectedRequest || !user) return;

    try {
      if (actionType === 'approve') {
        await approveRequest(selectedRequest.id, values.comments);
      } else {
        await rejectRequest(selectedRequest.id, values.comments || 'Rejected');
      }

      message.success(
        `Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`
      );
      setActionModalVisible(false);
      setDrawerVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to process request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      leave: 'Leave Request',
      expense: 'Expense Reimbursement',
      'petty-cash': 'Petty Cash',
      procurement: 'Procurement',
      asset: 'Asset Request',
    };
    return labels[type] || type;
  };

  const columns: ColumnsType<ApprovalRequest> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="blue">{getTypeLabel(type)}</Tag>
      ),
    },
    {
      title: 'Requestor',
      dataIndex: 'requestorId',
      key: 'requestorId',
      render: (requestorId) => {
        // This would normally fetch user data
        return <Text>EMP{requestorId.slice(-3)}</Text>;
      },
    },
    {
      title: 'Submitted Date',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={
          status === 'approved' ? <CheckCircleOutlined /> :
          status === 'rejected' ? <CloseCircleOutlined /> :
          <ClockCircleOutlined />
        }>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Current Stage',
      key: 'currentStage',
      render: (_, record) => {
        const currentStep = record.approvalChain.find((step) => step.status === 'pending');
        return currentStep ? `Level ${currentStep.level}` : 'Completed';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {pendingApprovals.some((r) => r.id === record.id) && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleAction(record, 'approve')}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleAction(record, 'reject')}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const filterData = (data: ApprovalRequest[]) => {
    return data.filter((item) => {
      const matchesSearch = searchText
        ? item.id.toLowerCase().includes(searchText.toLowerCase()) ||
          getTypeLabel(item.type).toLowerCase().includes(searchText.toLowerCase())
        : true;

      const matchesStatus = filterStatus === 'all' ? true : item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ marginBottom: '8px' }}>My Approvals</Title>
        <Text type="secondary">Manage approval requests and track your submissions</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending My Approval"
              value={stats.pendingCount}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="My Pending Requests"
              value={stats.myPendingRequests}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="My Approved"
              value={stats.myApprovedRequests}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="My Rejected"
              value={stats.myRejectedRequests}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        {/* Filters */}
        <Space style={{ marginBottom: '16px' }} wrap>
          <Input
            placeholder="Search by ID or type..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 180 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="approved">Approved</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
          </Select>
        </Space>

        {/* Tabs */}
        <Tabs
          defaultActiveKey="pending"
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  <Badge count={pendingApprovals.length} offset={[10, 0]}>
                    Pending My Approval
                  </Badge>
                </span>
              ),
              children: (
                <Table
                  columns={columns}
                  dataSource={filterData(pendingApprovals)}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'myRequests',
              label: `My Requests (${myRequests.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={filterData(myRequests)}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'all',
              label: 'All Requests',
              children: (
                <Table
                  columns={columns}
                  dataSource={filterData(approvalRequests)}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Details Drawer */}
      <Drawer
        title="Approval Request Details"
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedRequest && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Request ID">{selectedRequest.id}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{getTypeLabel(selectedRequest.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Submitted Date">
                {new Date(selectedRequest.submittedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Request Data">
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                  {JSON.stringify(selectedRequest.data, null, 2)}
                </pre>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: '24px', marginBottom: '16px' }}>
              Approval Timeline
            </Title>
            <Timeline
              items={selectedRequest.approvalChain.map((step) => ({
                color:
                  step.status === 'approved'
                    ? 'green'
                    : step.status === 'rejected'
                    ? 'red'
                    : 'blue',
                children: (
                  <div>
                    <Text strong>Level {step.level}: {step.approverRole}</Text>
                    <br />
                    <Text type="secondary">Approver ID: {step.approverId}</Text>
                    <br />
                    <Tag color={getStatusColor(step.status)}>{step.status.toUpperCase()}</Tag>
                    {step.approvedAt && (
                      <>
                        <br />
                        <Text type="secondary">
                          {new Date(step.approvedAt).toLocaleString()}
                        </Text>
                      </>
                    )}
                    {step.comments && (
                      <>
                        <br />
                        <Text italic>Comments: {step.comments}</Text>
                      </>
                    )}
                  </div>
                ),
              }))}
            />

            {pendingApprovals.some((r) => r.id === selectedRequest.id) && (
              <Space style={{ marginTop: '24px' }}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleAction(selectedRequest, 'approve')}
                >
                  Approve
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleAction(selectedRequest, 'reject')}
                >
                  Reject
                </Button>
              </Space>
            )}
          </div>
        )}
      </Drawer>

      {/* Action Modal */}
      <Modal
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Request`}
        open={actionModalVisible}
        onOk={form.submit}
        onCancel={() => {
          setActionModalVisible(false);
          form.resetFields();
        }}
        okText={actionType === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{ danger: actionType === 'reject' }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitAction}>
          <Form.Item
            name="comments"
            label="Comments (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Add any comments or notes..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
