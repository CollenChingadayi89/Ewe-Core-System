import { useState, useEffect } from 'react';
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
  const { requests, approveRequest, rejectRequest, fetchAllRequests, loading } = useApprovalStore();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form] = Form.useForm();

  // Fetch ALL approvals on mount (not just pending)
  useEffect(() => {
    if (user?.id) {
      fetchAllRequests(); // Fetch ALL requests (pending, approved, rejected)
    }
  }, [user?.id, fetchAllRequests]);

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

  const handleViewDetails = async (request: ApprovalRequest) => {
    // Fetch full details from API
    try {
      const { approvalRequestApi } = await import('../../services/api/approval');
      const fullDetails = await approvalRequestApi.retrieve(request.id);
      setSelectedRequest(fullDetails as any);
      setDrawerVisible(true);
    } catch (error) {
      console.error('Failed to fetch approval details:', error);
      message.error('Failed to load approval details');
      // Fallback to basic details
      setSelectedRequest(request);
      setDrawerVisible(true);
    }
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

      // Refresh the approval list
      fetchAllRequests();
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
                  loading={loading}
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
                  loading={loading}
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
                  loading={loading}
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
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedRequest && (
          <div>
            {/* Basic Information */}
            <Card size="small" title="Request Information" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Request Number" span={2}>
                  <Text strong>{(selectedRequest as any).request_number || selectedRequest.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Priority">
                  <Tag color={(selectedRequest as any).priority === 'high' ? 'red' : (selectedRequest as any).priority === 'medium' ? 'orange' : 'blue'}>
                    {((selectedRequest as any).priority || 'medium').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Submitted">
                  {new Date((selectedRequest as any).submitted_date || selectedRequest.submittedAt).toLocaleString('en-GB')}
                </Descriptions.Item>
                <Descriptions.Item label="Current Stage">
                  Stage {(selectedRequest as any).current_stage || 1}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Requester Information */}
            {(selectedRequest as any).requester_details && (
              <Card size="small" title="Requester" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Name">
                    {(selectedRequest as any).requester_details.full_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Employee No">
                    {(selectedRequest as any).requester_details.employee_number}
                  </Descriptions.Item>
                  <Descriptions.Item label="Department">
                    {(selectedRequest as any).requester_details.department}
                  </Descriptions.Item>
                  <Descriptions.Item label="Designation">
                    {(selectedRequest as any).requester_details.designation}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email" span={2}>
                    {(selectedRequest as any).requester_details.email}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Current Approver */}
            {(selectedRequest as any).current_approver_details && (
              <Card size="small" title="Current Approver" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Name">
                    {(selectedRequest as any).current_approver_details.full_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Employee No">
                    {(selectedRequest as any).current_approver_details.employee_number}
                  </Descriptions.Item>
                  <Descriptions.Item label="Department">
                    {(selectedRequest as any).current_approver_details.department}
                  </Descriptions.Item>
                  <Descriptions.Item label="Designation">
                    {(selectedRequest as any).current_approver_details.designation}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Request Summary/Description */}
            {(selectedRequest as any).request_summary && (
              <Card size="small" title="Request Summary" style={{ marginBottom: 16 }}>
                <Text>{(selectedRequest as any).request_summary}</Text>
              </Card>
            )}

            {/* Amount if applicable */}
            {(selectedRequest as any).amount && (
              <Card size="small" title="Amount" style={{ marginBottom: 16 }}>
                <Statistic value={(selectedRequest as any).amount} prefix="ZWG" />
              </Card>
            )}

            {/* Content Object Details (Leave Request, Expense, etc.) */}
            {(selectedRequest as any).content_object_details && (
              <Card
                size="small"
                title={
                  (selectedRequest as any).content_object_details.type === 'leave_request'
                    ? 'Leave Request Details'
                    : (selectedRequest as any).content_object_details.type === 'expense'
                    ? 'Expense Details'
                    : (selectedRequest as any).content_object_details.type === 'petty_cash'
                    ? 'Petty Cash Details'
                    : (selectedRequest as any).content_object_details.type === 'payable'
                    ? 'Payable Details'
                    : (selectedRequest as any).content_object_details.type === 'receivable'
                    ? 'Receivable Details'
                    : (selectedRequest as any).content_object_details.type === 'procurement'
                    ? 'Procurement Details'
                    : 'Request Details'
                }
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={2} size="small">
                  {/* Leave Request Details */}
                  {(selectedRequest as any).content_object_details.type === 'leave_request' && (
                    <>
                      <Descriptions.Item label="Request Number" span={2}>
                        <Text strong>{(selectedRequest as any).content_object_details.request_number}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Leave Type">
                        {(selectedRequest as any).content_object_details.leave_policy}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor((selectedRequest as any).content_object_details.status)}>
                          {(selectedRequest as any).content_object_details.status?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Start Date">
                        {(selectedRequest as any).content_object_details.start_date}
                      </Descriptions.Item>
                      <Descriptions.Item label="End Date">
                        {(selectedRequest as any).content_object_details.end_date}
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Days">
                        {(selectedRequest as any).content_object_details.total_days} days
                      </Descriptions.Item>
                      <Descriptions.Item label="Working Days">
                        {(selectedRequest as any).content_object_details.working_days_count} days
                      </Descriptions.Item>
                      <Descriptions.Item label="Reason" span={2}>
                        {(selectedRequest as any).content_object_details.reason}
                      </Descriptions.Item>
                      {(selectedRequest as any).content_object_details.emergency_contact && (
                        <Descriptions.Item label="Emergency Contact" span={2}>
                          {(selectedRequest as any).content_object_details.emergency_contact}
                        </Descriptions.Item>
                      )}
                      {(selectedRequest as any).content_object_details.emergency_address && (
                        <Descriptions.Item label="Emergency Address" span={2}>
                          {(selectedRequest as any).content_object_details.emergency_address}
                        </Descriptions.Item>
                      )}
                    </>
                  )}

                  {/* Expense Details */}
                  {(selectedRequest as any).content_object_details.type === 'expense' && (
                    <>
                      <Descriptions.Item label="Expense Number">
                        <Text strong>{(selectedRequest as any).content_object_details.expense_number}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Category">
                        {(selectedRequest as any).content_object_details.category}
                      </Descriptions.Item>
                      <Descriptions.Item label="Amount">
                        ZWG {(selectedRequest as any).content_object_details.amount?.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {(selectedRequest as any).content_object_details.date}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor((selectedRequest as any).content_object_details.status)}>
                          {(selectedRequest as any).content_object_details.status?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Description" span={2}>
                        {(selectedRequest as any).content_object_details.description}
                      </Descriptions.Item>
                    </>
                  )}

                  {/* Petty Cash Details */}
                  {(selectedRequest as any).content_object_details.type === 'petty_cash' && (
                    <>
                      <Descriptions.Item label="Voucher Number">
                        <Text strong>{(selectedRequest as any).content_object_details.voucher_number}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Amount">
                        ZWG {(selectedRequest as any).content_object_details.amount?.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {(selectedRequest as any).content_object_details.date}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor((selectedRequest as any).content_object_details.status)}>
                          {(selectedRequest as any).content_object_details.status?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Purpose" span={2}>
                        {(selectedRequest as any).content_object_details.purpose}
                      </Descriptions.Item>
                    </>
                  )}

                  {/* Payable Details */}
                  {(selectedRequest as any).content_object_details.type === 'payable' && (
                    <>
                      <Descriptions.Item label="Invoice Number">
                        <Text strong>{(selectedRequest as any).content_object_details.invoice_number}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Vendor">
                        {(selectedRequest as any).content_object_details.vendor}
                      </Descriptions.Item>
                      <Descriptions.Item label="Amount">
                        ZWG {(selectedRequest as any).content_object_details.amount?.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Due Date">
                        {(selectedRequest as any).content_object_details.due_date}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor((selectedRequest as any).content_object_details.status)}>
                          {(selectedRequest as any).content_object_details.status?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Description" span={2}>
                        {(selectedRequest as any).content_object_details.description}
                      </Descriptions.Item>
                    </>
                  )}

                  {/* Receivable Details */}
                  {(selectedRequest as any).content_object_details.type === 'receivable' && (
                    <>
                      <Descriptions.Item label="Invoice Number">
                        <Text strong>{(selectedRequest as any).content_object_details.invoice_number}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Member">
                        {(selectedRequest as any).content_object_details.member}
                      </Descriptions.Item>
                      <Descriptions.Item label="Service Type">
                        {(selectedRequest as any).content_object_details.service_type}
                      </Descriptions.Item>
                      <Descriptions.Item label="Amount">
                        ZWG {(selectedRequest as any).content_object_details.amount?.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Due Date">
                        {(selectedRequest as any).content_object_details.due_date}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor((selectedRequest as any).content_object_details.status)}>
                          {(selectedRequest as any).content_object_details.status?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Description" span={2}>
                        {(selectedRequest as any).content_object_details.description}
                      </Descriptions.Item>
                    </>
                  )}

                  {/* Procurement Details */}
                  {(selectedRequest as any).content_object_details.type === 'procurement' && (
                    <>
                      <Descriptions.Item label="Request Number">
                        <Text strong>{(selectedRequest as any).content_object_details.request_number}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Item">
                        {(selectedRequest as any).content_object_details.item}
                      </Descriptions.Item>
                      <Descriptions.Item label="Quantity">
                        {(selectedRequest as any).content_object_details.quantity}
                      </Descriptions.Item>
                      <Descriptions.Item label="Estimated Cost">
                        ZWG {(selectedRequest as any).content_object_details.estimated_cost?.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor((selectedRequest as any).content_object_details.status)}>
                          {(selectedRequest as any).content_object_details.status?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Purpose" span={2}>
                        {(selectedRequest as any).content_object_details.purpose}
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Approval Timeline */}
            <Card size="small" title="Approval History" style={{ marginBottom: 16 }}>
              {(selectedRequest as any).approval_steps && (selectedRequest as any).approval_steps.length > 0 ? (
                <Timeline
                  items={(selectedRequest as any).approval_steps.map((step: any) => ({
                    color:
                      step.status === 'approved'
                        ? 'green'
                        : step.status === 'rejected'
                        ? 'red'
                        : step.status === 'skipped'
                        ? 'gray'
                        : 'blue',
                    children: (
                      <div>
                        <Space direction="vertical" size={4}>
                          <Text strong>Stage {step.stage_number}: {step.stage_name}</Text>
                          <Text>Approver: {step.approver_name}</Text>
                          <Tag color={getStatusColor(step.status)}>{step.status.toUpperCase()}</Tag>
                          {step.decision_date && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Decided: {new Date(step.decision_date).toLocaleString('en-GB')}
                            </Text>
                          )}
                          {step.comments && (
                            <Text italic style={{ fontSize: '12px' }}>
                              Comments: {step.comments}
                            </Text>
                          )}
                        </Space>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Text type="secondary">No approval steps yet</Text>
              )}
            </Card>

            {/* Action Buttons */}
            {pendingApprovals.some((r) => r.id === selectedRequest.id) && (
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  size="large"
                  onClick={() => {
                    setDrawerVisible(false);
                    handleAction(selectedRequest, 'approve');
                  }}
                >
                  Approve
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  size="large"
                  onClick={() => {
                    setDrawerVisible(false);
                    handleAction(selectedRequest, 'reject');
                  }}
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
