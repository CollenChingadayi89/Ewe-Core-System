/**
 * Leave Management Page - Enhanced with Ledger-based System
 *
 * Features:
 * - Tabbed interface (All Requests, My Requests, Pending My Approval)
 * - Leave balance cards with real-time updates
 * - Comprehensive filtering and search
 * - Create leave request with validation
 * - Approve/reject workflow
 * - View transaction history
 * - Integration with ledger-based stores
 */

import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Button,
  Space,
  Modal,
  Form,
  DatePicker,
  Input,
  Select,
  Card,
  Tabs,
  Tag,
  message,
  Alert,
  Tooltip,
  Divider,
  Progress,
  Drawer,
  Timeline,
  Upload,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  SettingOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { PageHeader, StatCard, StatusTag, DataTable, FilterBar } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useLeaveStore } from '../../store/leaveStore';
import type { LeaveRequest } from '../../types';
import type { LeaveBalance, LeaveTransaction, LeaveTypeName } from '../../types/leave-ledger';
import { calculateWorkingDays } from '../../mock/public-holidays';
import { mockLeavePolicies } from '../../mock/leave-config';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

/**
 * Leave type color mapping for consistent UI
 */
const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: '#00d084',
  sick: '#ff6900',
  maternity: '#ec4899',
  paternity: '#3b82f6',
  special: '#8b5cf6',
  study: '#0693e3',
  unpaid: '#8c8c8c',
};

/**
 * Leave type icons
 */
const LEAVE_TYPE_ICONS: Record<string, string> = {
  annual: '🏖️',
  sick: '🤒',
  maternity: '🤱',
  paternity: '👶',
  special: '⭐',
  study: '📚',
  unpaid: '💼',
};

export const LeavesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    allRequests,
    myRequests,
    pendingMyApproval,
    myBalances,
    loading,
    fetchAllRequests,
    fetchMyLeaves,
    fetchPendingApprovals,
    fetchLeaveBalance,
    fetchTransactionHistory,
    submitRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    validateLeaveRequest,
    getLeavePolicy,
  } = useLeaveStore();

  // State
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any>(undefined);

  // Modals
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [balanceDrawerVisible, setBalanceDrawerVisible] = useState(false);
  const [transactionDrawerVisible, setTransactionDrawerVisible] = useState(false);

  // Selected items
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('annual');
  const [transactionHistory, setTransactionHistory] = useState<LeaveTransaction[]>([]);

  // Forms
  const [form] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const [rejectionForm] = Form.useForm();

  // Form state for real-time validation
  const [formLeaveType, setFormLeaveType] = useState<string | undefined>(undefined);
  const [formDateRange, setFormDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  // Load data on mount
  useEffect(() => {
    fetchAllRequests();
    if (user?.id) {
      fetchMyLeaves(user.id);
      fetchPendingApprovals(user.id);
    }
  }, [user?.id]);

  // Calculate statistics
  const totalRequests = allRequests.length;
  const pendingCount = allRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = allRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = allRequests.filter((r) => r.status === 'rejected').length;

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'my-requests':
        return myRequests;
      case 'pending-approval':
        return pendingMyApproval;
      default:
        return allRequests;
    }
  };

  // Filter requests
  const filteredRequests = getCurrentData().filter((request) => {
    const matchesSearch =
      request.requestorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeaveType = !leaveTypeFilter || request.data.leaveType === leaveTypeFilter;
    const matchesStatus = !statusFilter || request.status === statusFilter;

    return matchesSearch && matchesLeaveType && matchesStatus;
  });

  // Real-time form validation
  useEffect(() => {
    if (formLeaveType && formDateRange && user?.id) {
      const [start, end] = formDateRange;
      const validation = validateLeaveRequest(
        user.id,
        formLeaveType,
        start.format('YYYY-MM-DD'),
        end.format('YYYY-MM-DD')
      );
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      setCalculatedDays(validation.calculatedWorkingDays || 0);
    } else {
      setValidationErrors([]);
      setValidationWarnings([]);
      setCalculatedDays(0);
    }
  }, [formLeaveType, formDateRange, user?.id]);

  // Handle leave request submission
  const handleSubmitLeaveRequest = async (values: any) => {
    try {
      if (!user?.id || !user?.name) {
        message.error('User information not available');
        return;
      }

      const [startDate, endDate] = values.dateRange;

      await submitRequest(user.id, user.name, {
        leaveType: values.leaveType,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        reason: values.reason,
        handoverNotes: values.handoverNotes,
        attachments: values.attachments?.fileList?.map((file: any) => file.name),
        isEmergencyLeave: values.isEmergency || false,
        specialLeaveTrigger: values.specialLeaveTrigger,
      });

      message.success('Leave request submitted successfully!');
      setRequestModalVisible(false);
      form.resetFields();
      setFormLeaveType(undefined);
      setFormDateRange(null);

      // Refresh data
      fetchMyLeaves(user.id);
      fetchAllRequests();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to submit leave request');
    }
  };

  // Handle approve
  const handleApprove = async () => {
    try {
      const values = await approvalForm.validateFields();
      if (!selectedRequest || !user?.id) return;

      await approveRequest({
        requestId: selectedRequest.id,
        approverId: user.id,
        comment: values.comment,
      });

      message.success('Leave request approved successfully');
      setApprovalModalVisible(false);
      approvalForm.resetFields();
      setSelectedRequest(null);

      // Refresh data
      fetchAllRequests();
      if (user.id) {
        fetchPendingApprovals(user.id);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to approve request');
    }
  };

  // Handle reject
  const handleReject = async () => {
    try {
      const values = await rejectionForm.validateFields();
      if (!selectedRequest || !user?.id) return;

      await rejectRequest({
        requestId: selectedRequest.id,
        approverId: user.id,
        comment: values.comment,
      });

      message.success('Leave request rejected');
      setRejectionModalVisible(false);
      rejectionForm.resetFields();
      setSelectedRequest(null);

      // Refresh data
      fetchAllRequests();
      if (user.id) {
        fetchPendingApprovals(user.id);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to reject request');
    }
  };

  // Handle view details
  const handleViewDetails = (id: string) => {
    navigate(`/hr/leaves/${id}`);
  };

  // Handle view balance
  const handleViewBalance = (leaveType: string) => {
    setSelectedLeaveType(leaveType);
    setBalanceDrawerVisible(true);
  };

  // Handle view transaction history
  const handleViewTransactions = (leaveType: string) => {
    if (!user?.id) return;
    const transactions = fetchTransactionHistory(user.id, leaveType);
    setTransactionHistory(transactions);
    setSelectedLeaveType(leaveType);
    setTransactionDrawerVisible(true);
  };

  // Filters configuration
  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by employee or request ID...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 280,
    },
    {
      type: 'select',
      label: 'Leave Type',
      placeholder: 'All Types',
      onChange: setLeaveTypeFilter,
      value: leaveTypeFilter,
      width: 160,
      options: mockLeavePolicies
        .filter((p) => p.isActive)
        .map((p) => ({
          label: p.displayName,
          value: p.leaveType,
        })),
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 160,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      type: 'dateRange',
      label: 'Date Range',
      onChange: setDateRange,
      value: dateRange,
      width: 280,
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setLeaveTypeFilter(undefined);
    setStatusFilter(undefined);
    setDateRange(undefined);
  };

  // Table columns
  const columns: ColumnsType<LeaveRequest> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id: string) => (
        <span style={{ fontWeight: 600, color: '#0693e3', fontFamily: 'monospace' }}>
          {id}
        </span>
      ),
    },
    {
      title: 'Employee',
      dataIndex: 'requestorName',
      key: 'requestorName',
      width: 180,
      render: (name: string, record: LeaveRequest) => (
        <div>
          <div style={{ fontWeight: 500, color: '#32373c' }}>{name}</div>
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '2px' }}>
            {record.submittedDate
              ? dayjs(record.submittedDate).format('DD/MM/YYYY HH:mm')
              : 'Not submitted'}
          </div>
        </div>
      ),
    },
    {
      title: 'Leave Type',
      key: 'leaveType',
      width: 150,
      render: (_: any, record: LeaveRequest) => (
        <Tag
          color={LEAVE_TYPE_COLORS[record.data.leaveType] || 'default'}
          style={{ borderRadius: '4px', fontWeight: 500 }}
        >
          {LEAVE_TYPE_ICONS[record.data.leaveType]} {record.data.leaveType.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 200,
      render: (_: any, record: LeaveRequest) => (
        <div>
          <div style={{ fontSize: '13px', color: '#595959' }}>
            {dayjs(record.data.startDate).format('DD/MM/YYYY')} →{' '}
            {dayjs(record.data.endDate).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '2px' }}>
            <strong>{record.data.days}</strong> days{' '}
            {record.data.workingDaysCount && record.data.workingDaysCount !== record.data.days && (
              <span>({record.data.workingDaysCount} working)</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Balance Impact',
      key: 'balance',
      width: 140,
      align: 'right',
      render: (_: any, record: LeaveRequest) => (
        <div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            Before: <strong>{record.data.balanceBeforeRequest || '-'}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            After: <strong>{record.data.balanceAfterRequest || '-'}</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: LeaveRequest) => (
        <Tooltip
          title={
            record.approvalChain?.length > 0
              ? `Approval Chain: ${record.approvalChain.map((s) => s.approverName).join(' → ')}`
              : undefined
          }
        >
          <StatusTag status={status} />
        </Tooltip>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colors: Record<string, string> = {
          low: 'blue',
          medium: 'orange',
          high: 'red',
        };
        return <Tag color={colors[priority] || 'default'}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: LeaveRequest) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.id)}
            />
          </Tooltip>
          {record.status === 'pending' && record.currentApproverId === user?.id && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  setApprovalModalVisible(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  setRejectionModalVisible(true);
                }}
                style={{ borderRadius: '6px' }}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle={`${filteredRequests.length} request${filteredRequests.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[{ title: 'Human Resources' }, { title: 'Leave Management' }]}
        actions={
          <Space>
            <Button
              icon={<SettingOutlined />}
              onClick={() => navigate('/hr/leave-configuration')}
              style={{ borderRadius: '8px', fontWeight: 500 }}
            >
              Configuration
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setRequestModalVisible(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
                fontWeight: 500,
              }}
            >
              Request Leave
            </Button>
          </Space>
        }
      />

      {/* My Leave Balances */}
      {user?.id && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>My Leave Balances</span>
            </Space>
          }
          style={{ marginBottom: '20px' }}
          extra={
            <Button
              type="link"
              icon={<HistoryOutlined />}
              onClick={() => handleViewTransactions('annual')}
            >
              View History
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {mockLeavePolicies
              .filter((p) => p.isActive && p.accrualMethod !== 'none')
              .map((policy) => {
                const balance = fetchLeaveBalance(user.id!, policy.leaveType);
                const percentage = balance
                  ? Math.round((balance.availableBalance / (policy.annualEntitlementDays || 1)) * 100)
                  : 0;

                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={policy.leaveType}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => handleViewBalance(policy.leaveType)}
                      style={{
                        borderLeft: `4px solid ${LEAVE_TYPE_COLORS[policy.leaveType] || '#ccc'}`,
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px', marginRight: '6px' }}>
                          {LEAVE_TYPE_ICONS[policy.leaveType]}
                        </span>
                        <span style={{ fontWeight: 600, color: '#32373c' }}>
                          {policy.displayName}
                        </span>
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
                        {balance?.availableBalance || 0}
                        <span style={{ fontSize: '14px', fontWeight: 400, color: '#8c8c8c' }}>
                          {' '}
                          / {policy.annualEntitlementDays || '-'} days
                        </span>
                      </div>
                      <Progress
                        percent={percentage}
                        strokeColor={LEAVE_TYPE_COLORS[policy.leaveType]}
                        showInfo={false}
                        size="small"
                      />
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#8c8c8c' }}>
                        <Row>
                          <Col span={12}>
                            Used: <strong>{balance?.totalUsed || 0}</strong>
                          </Col>
                          <Col span={12} style={{ textAlign: 'right' }}>
                            Pending: <strong>{balance?.totalPending || 0}</strong>
                          </Col>
                        </Row>
                      </div>
                    </Card>
                  </Col>
                );
              })}
          </Row>
        </Card>
      )}

      {/* Statistics Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Total Requests"
            value={totalRequests}
            icon={<FileTextOutlined />}
            iconBg="rgba(103, 58, 183, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Pending Approval"
            value={pendingCount}
            icon={<ClockCircleOutlined />}
            iconBg="rgba(255, 105, 0, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Approved Leaves"
            value={approvedCount}
            icon={<CheckOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Badge count={pendingMyApproval.length} offset={[-10, 10]}>
            <StatCard
              title="Awaiting My Approval"
              value={pendingMyApproval.length}
              icon={<ExclamationCircleOutlined />}
              iconBg="rgba(255, 193, 7, 0.1)"
            />
          </Badge>
        </Col>
      </Row>

      {/* Tabs */}
      <Card style={{ marginBottom: '20px' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`All Requests (${allRequests.length})`} key="all" />
          <TabPane tab={`My Requests (${myRequests.length})`} key="my-requests" />
          <TabPane
            tab={
              <Badge count={pendingMyApproval.length} offset={[10, 0]}>
                Pending My Approval
              </Badge>
            }
            key="pending-approval"
          />
        </Tabs>
      </Card>

      {/* Filters */}
      <FilterBar filters={filters} onSearch={setSearchTerm} onReset={handleReset} />

      {/* Requests Table */}
      <DataTable
        columns={columns}
        dataSource={filteredRequests}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} entries`,
        }}
        scroll={{ x: 1400 }}
      />

      {/* Leave Request Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            <span>Request Leave</span>
          </Space>
        }
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
          setFormLeaveType(undefined);
          setFormDateRange(null);
        }}
        onOk={form.submit}
        width={700}
        okText="Submit Request"
        okButtonProps={{
          disabled: validationErrors.length > 0,
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitLeaveRequest}>
          <Form.Item
            label="Leave Type"
            name="leaveType"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select
              placeholder="Select leave type"
              size="large"
              onChange={(value) => setFormLeaveType(value)}
            >
              {mockLeavePolicies
                .filter((p) => p.isActive)
                .map((policy) => (
                  <Select.Option key={policy.leaveType} value={policy.leaveType}>
                    <Space>
                      <span>{LEAVE_TYPE_ICONS[policy.leaveType]}</span>
                      <span>{policy.displayName}</span>
                      {policy.isStatutory && <Tag color="blue">Statutory</Tag>}
                    </Space>
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Leave Duration"
            name="dateRange"
            rules={[{ required: true, message: 'Please select leave duration' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              size="large"
              format="DD/MM/YYYY"
              onChange={(dates) => setFormDateRange(dates as [Dayjs, Dayjs] | null)}
            />
          </Form.Item>

          {/* Real-time validation feedback */}
          {calculatedDays > 0 && (
            <Alert
              message={`Calculated Leave Days: ${calculatedDays} days`}
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: '16px' }}
            />
          )}

          {validationErrors.length > 0 && (
            <Alert
              message="Validation Errors"
              description={
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {validationWarnings.length > 0 && (
            <Alert
              message="Warnings"
              description={
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {validationWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              }
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {formLeaveType === 'special' && (
            <Form.Item
              label="Special Leave Trigger"
              name="specialLeaveTrigger"
              rules={[{ required: true, message: 'Please select trigger' }]}
            >
              <Select placeholder="Select reason" size="large">
                <Select.Option value="bereavement">Bereavement (Death of family member)</Select.Option>
                <Select.Option value="wedding">Wedding (Own or immediate family)</Select.Option>
                <Select.Option value="court-witness">Court Witness / Jury Duty</Select.Option>
                <Select.Option value="military-service">Military Service</Select.Option>
                <Select.Option value="relocation">Relocation / Moving</Select.Option>
                <Select.Option value="other">Other (Management approval required)</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label="Reason for Leave"
            name="reason"
            rules={[{ required: true, message: 'Please enter reason for leave' }]}
          >
            <TextArea
              rows={4}
              placeholder="Please provide detailed reason for your leave request..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="Handover Notes" name="handoverNotes">
            <TextArea
              rows={3}
              placeholder="Provide handover notes for colleagues covering your duties..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="Supporting Documents" name="attachments">
            <Upload beforeUpload={() => false} maxCount={5}>
              <Button icon={<UploadOutlined />}>Upload Documents</Button>
            </Upload>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px' }}>
              Medical certificates required for sick leave &gt; 3 days
            </div>
          </Form.Item>

          <Form.Item name="isEmergency" valuePropName="checked">
            <div>
              <input type="checkbox" id="emergency" />
              <label htmlFor="emergency" style={{ marginLeft: '8px' }}>
                This is an emergency leave request
              </label>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Approval Modal */}
      <Modal
        title="Approve Leave Request"
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          approvalForm.resetFields();
        }}
        onOk={handleApprove}
        okText="Approve"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
            border: 'none',
          },
        }}
      >
        {selectedRequest && (
          <div>
            <p>
              <strong>Employee:</strong> {selectedRequest.requestorName}
            </p>
            <p>
              <strong>Leave Type:</strong>{' '}
              <Tag color={LEAVE_TYPE_COLORS[selectedRequest.data.leaveType]}>
                {selectedRequest.data.leaveType.toUpperCase()}
              </Tag>
            </p>
            <p>
              <strong>Duration:</strong> {selectedRequest.data.days} days (
              {dayjs(selectedRequest.data.startDate).format('DD/MM/YYYY')} →{' '}
              {dayjs(selectedRequest.data.endDate).format('DD/MM/YYYY')})
            </p>
            <p>
              <strong>Reason:</strong> {selectedRequest.data.reason}
            </p>
            <Divider />
            <Form form={approvalForm} layout="vertical">
              <Form.Item label="Approval Comment (Optional)" name="comment">
                <TextArea rows={3} placeholder="Add any comments..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title="Reject Leave Request"
        open={rejectionModalVisible}
        onCancel={() => {
          setRejectionModalVisible(false);
          rejectionForm.resetFields();
        }}
        onOk={handleReject}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        {selectedRequest && (
          <div>
            <p>
              <strong>Employee:</strong> {selectedRequest.requestorName}
            </p>
            <p>
              <strong>Leave Type:</strong>{' '}
              <Tag color={LEAVE_TYPE_COLORS[selectedRequest.data.leaveType]}>
                {selectedRequest.data.leaveType.toUpperCase()}
              </Tag>
            </p>
            <Divider />
            <Form form={rejectionForm} layout="vertical">
              <Form.Item
                label="Rejection Reason"
                name="comment"
                rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Explain why this leave request is being rejected..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Balance Details Drawer */}
      <Drawer
        title={`${selectedLeaveType.toUpperCase()} Leave Balance`}
        placement="right"
        onClose={() => setBalanceDrawerVisible(false)}
        open={balanceDrawerVisible}
        width={500}
      >
        {user?.id && (
          <div>
            {(() => {
              const balance = fetchLeaveBalance(user.id!, selectedLeaveType);
              const policy = getLeavePolicy(selectedLeaveType);

              return balance && policy ? (
                <>
                  <Card>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '48px' }}>{LEAVE_TYPE_ICONS[selectedLeaveType]}</div>
                      <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px' }}>
                        {balance.availableBalance} days
                      </div>
                      <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Available Balance</div>
                    </div>

                    <Divider />

                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 600, color: '#00d084' }}>
                            {balance.totalAccrued}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Total Accrued</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff4d4f' }}>
                            {balance.totalUsed}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Total Used</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff6900' }}>
                            {balance.totalApprovedFuture}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Approved (Future)</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 600, color: '#8c8c8c' }}>
                            {balance.totalPending}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Pending Approval</div>
                        </div>
                      </Col>
                    </Row>

                    <Divider />

                    <div>
                      <h4>Policy Details</h4>
                      <p>
                        <strong>Annual Entitlement:</strong> {policy.annualEntitlementDays} days
                      </p>
                      <p>
                        <strong>Accrual Method:</strong> {policy.accrualMethod}
                      </p>
                      {policy.maxAccumulationDays && (
                        <p>
                          <strong>Maximum Cap:</strong> {policy.maxAccumulationDays} days
                        </p>
                      )}
                      {policy.statutoryReference && (
                        <p>
                          <strong>Statutory Ref:</strong> {policy.statutoryReference}
                        </p>
                      )}
                    </div>
                  </Card>

                  <Button
                    type="primary"
                    block
                    style={{ marginTop: '16px' }}
                    onClick={() => handleViewTransactions(selectedLeaveType)}
                  >
                    View Transaction History
                  </Button>
                </>
              ) : (
                <Alert message="Balance information not available" type="info" />
              );
            })()}
          </div>
        )}
      </Drawer>

      {/* Transaction History Drawer */}
      <Drawer
        title={`${selectedLeaveType.toUpperCase()} Leave Transaction History`}
        placement="right"
        onClose={() => setTransactionDrawerVisible(false)}
        open={transactionDrawerVisible}
        width={600}
      >
        <Timeline mode="left">
          {transactionHistory.map((txn) => {
            const isCredit = txn.amount > 0;
            return (
              <Timeline.Item
                key={txn.id}
                color={isCredit ? 'green' : 'red'}
                label={dayjs(txn.effectiveDate).format('DD/MM/YYYY')}
              >
                <Card size="small">
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color={isCredit ? 'success' : 'error'}>
                      {isCredit ? '+' : ''}
                      {txn.amount} days
                    </Tag>
                    <Tag>{txn.transactionType.toUpperCase()}</Tag>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px' }}>{txn.reason}</p>
                  {txn.notes && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8c8c8c' }}>
                      {txn.notes}
                    </p>
                  )}
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#8c8c8c' }}>
                    Created: {dayjs(txn.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </Card>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Drawer>
    </div>
  );
};
