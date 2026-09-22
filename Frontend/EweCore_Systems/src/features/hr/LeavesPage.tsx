/**
 * Leave Management Page - Configuration-Driven Dynamic Form
 *
 * Features:
 * - NO Zustand - Direct API integration
 * - Dynamic form based on leave policy configuration
 * - Gender validation (men can't apply maternity, women can't apply paternity)
 * - Conditional document upload (required vs optional based on policy)
 * - Real-time balance display when leave type selected
 * - Real-time working days calculation
 * - Minimum notice validation
 * - Tabbed interface (All, My Requests, Pending Approval)
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
  Progress,
  Upload,
  Spin,
  Typography,
  Checkbox,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EyeOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs, { type Dayjs } from 'dayjs';
import { PageHeader, StatCard, StatusTag, DataTable } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import employeeApi from '../../services/api/employeeApi';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// ============================================================================
// INTERFACES
// ============================================================================

interface LeavePolicy {
  id: string;
  code: string;
  leave_type: string;
  display_name: string;
  description: string;
  is_statutory: boolean;
  is_paid: boolean;
  annual_entitlement_days: number;
  gender_restriction: 'male' | 'female' | 'none';
  requires_documentation: boolean;
  documentation_types: string[];
  documentation_mandatory: boolean;
  minimum_notice_days: number;
  counts_weekends_in_leave: boolean;
  counts_public_holidays_in_leave: boolean;
  supports_half_days: boolean;
  is_active: boolean;
}

interface LeaveRequest {
  id: string;
  request_number: string;
  employee: string;
  employee_name: string;
  employee_number: string;
  leave_policy: string;
  leave_type: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  working_days_count: number;
  is_half_day: boolean;
  reason: string;
  status: string;
  priority: string;
  is_emergency_leave: boolean;
  created_at: string;
}

interface LeaveBalance {
  total_accrued: number;
  total_used: number;
  total_pending: number;
  available_balance: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: '#00d084',
  sick: '#ff6900',
  maternity: '#ec4899',
  paternity: '#3b82f6',
  special: '#8b5cf6',
  study: '#0693e3',
  unpaid: '#8c8c8c',
};

const LEAVE_TYPE_ICONS: Record<string, string> = {
  annual: '🏖️',
  sick: '🤒',
  maternity: '🤱',
  paternity: '👶',
  special: '⭐',
  study: '📚',
  unpaid: '💼',
};

const SPECIAL_LEAVE_TRIGGERS = [
  { value: 'bereavement', label: 'Bereavement (Death of family member)' },
  { value: 'wedding', label: 'Wedding (Own or immediate family)' },
  { value: 'court-witness', label: 'Court Witness / Jury Duty' },
  { value: 'military-service', label: 'Military Service' },
  { value: 'relocation', label: 'Relocation / Moving' },
  { value: 'other', label: 'Other (specify in reason)' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LeavesPage = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  // ============================================================================
  // STATE - Data (No Zustand!)
  // ============================================================================

  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [pendingApproval, setPendingApproval] = useState<LeaveRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // ============================================================================
  // STATE - UI
  // ============================================================================

  const [activeTab, setActiveTab] = useState('my-requests');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // My Balances modal
  const [isBalancesModalOpen, setIsBalancesModalOpen] = useState(false);
  const [myBalances, setMyBalances] = useState<any[]>([]);
  const [myBalancesLoading, setMyBalancesLoading] = useState(false);

  // ============================================================================
  // STATE - Dynamic Form
  // ============================================================================

  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);
  const [genderError, setGenderError] = useState<string | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState<any>(null);
  const [calculatingDays, setCalculatingDays] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const response = await employeeApi.leavePolicies.list({ is_active: true, page_size: 100 });
      setPolicies(response.results || []);
    } catch (error) {
      console.error('Failed to fetch leave policies:', error);
      message.error('Failed to load leave types');
    } finally {
      setPoliciesLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    if (!user?.id) return;

    setRequestsLoading(true);
    try {
      // Fetch all requests (HR/managers see all, employees see their own)
      const allResponse = await employeeApi.leaveRequests.list({ page_size: 1000 });
      setAllRequests(allResponse.results || []);

      // Filter my requests
      const myReqs = (allResponse.results || []).filter((req: LeaveRequest) => req.employee === user.id);
      setMyRequests(myReqs);

      // Fetch pending approvals (requests where I'm the approver)
      const pendingResponse = await employeeApi.leaveRequests.list({
        status: 'pending',
        page_size: 1000
      });
      setPendingApproval(pendingResponse.results || []);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      message.error('Failed to load leave requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchBalance = async (policyId: string) => {
    if (!user?.id || !policyId) return;

    setBalanceLoading(true);
    try {
      const balanceData = await employeeApi.leaveBalance.get({
        employee: user.id,
        leave_policy: policyId,
      });
      setBalance(balanceData);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const calculateWorkingDays = async (startDate: string, endDate: string, policyId: string) => {
    setCalculatingDays(true);
    try {
      const result = await employeeApi.leaveRequests.calculateDays({
        start_date: startDate,
        end_date: endDate,
        leave_policy_id: policyId,
        is_half_day: form.getFieldValue('is_half_day') || false,
      });
      setCalculatedDays(result);
    } catch (error) {
      console.error('Failed to calculate working days:', error);
      setCalculatedDays(null);
    } finally {
      setCalculatingDays(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchLeaveRequests();
  }, [user]);

  // ============================================================================
  // HANDLERS - Policy Selection (Dynamic Form)
  // ============================================================================

  const handlePolicyChange = (policyId: string) => {
    const policy = policies.find(p => p.id === policyId);
    setSelectedPolicy(policy || null);

    // Clear previous state
    setGenderError(null);
    setBalance(null);
    setCalculatedDays(null);
    setFileList([]);

    if (!policy) return;

    // Check gender restriction
    if (policy.gender_restriction !== 'none' && user) {
      if (policy.gender_restriction === 'female' && user.gender === 'male') {
        setGenderError(`${policy.display_name} is only available to female employees`);
      } else if (policy.gender_restriction === 'male' && user.gender === 'female') {
        setGenderError(`${policy.display_name} is only available to male employees`);
      }
    }

    // Fetch balance for this leave type
    fetchBalance(policyId);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates || !dates[0] || !dates[1] || !selectedPolicy) {
      setCalculatedDays(null);
      return;
    }

    calculateWorkingDays(
      dates[0].format('YYYY-MM-DD'),
      dates[1].format('YYYY-MM-DD'),
      selectedPolicy.id
    );
  };

  // ============================================================================
  // HANDLERS - My Balances
  // ============================================================================

  const handleShowMyBalances = async () => {
    if (!user?.id) {
      message.error('User information not available');
      return;
    }

    setIsBalancesModalOpen(true);
    setMyBalancesLoading(true);

    try {
      const balances: any[] = [];

      // Fetch balances for logged-in user for all leave policies
      for (const policy of policies) {
        try {
          const balanceData = await employeeApi.leaveBalance.get({
            employee: user.id,
            leave_policy: policy.id,
          });

          // Only include policies with some balance activity
          if (balanceData.total_accrued > 0 || balanceData.total_used > 0) {
            balances.push({
              policy_id: policy.id,
              policy_name: policy.display_name,
              leave_type: policy.leave_type,
              total_accrued: balanceData.total_accrued,
              total_used: balanceData.total_used,
              total_pending: balanceData.total_pending,
              available_balance: balanceData.available_balance,
            });
          }
        } catch (policyError: any) {
          // Skip policies that fail (e.g., employee has no balance for this policy)
          console.warn(`Failed to fetch balance for policy ${policy.display_name}:`, policyError?.response?.data || policyError.message);
        }
      }

      setMyBalances(balances);
    } catch (error) {
      console.error('Failed to fetch my balances:', error);
      message.error('Failed to load your leave balances');
    } finally {
      setMyBalancesLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS - Create Leave Request
  // ============================================================================

  const handleCreateLeave = () => {
    form.resetFields();
    setSelectedPolicy(null);
    setGenderError(null);
    setBalance(null);
    setCalculatedDays(null);
    setFileList([]);
    setIsCreateModalOpen(true);
  };

  const handleSubmitLeaveRequest = async (values: any) => {
    if (genderError) {
      message.error(genderError);
      return;
    }

    if (!selectedPolicy) {
      message.error('Please select a leave type');
      return;
    }

    // Check if documentation is required and provided
    if (selectedPolicy.requires_documentation && selectedPolicy.documentation_mandatory) {
      if (fileList.length === 0) {
        message.error(`Please upload required documents: ${selectedPolicy.documentation_types?.join(', ')}`);
        return;
      }
    }

    try {
      const [startDate, endDate] = values.dateRange;

      const requestData = {
        employee: user?.id,
        leave_policy: selectedPolicy.id,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        is_half_day: values.is_half_day || false,
        reason: values.reason,
        handover_notes: values.handover_notes,
        address_during_leave: values.address_during_leave,
        contact_during_leave: values.contact_during_leave,
        special_leave_trigger: values.special_leave_trigger,
        is_emergency_leave: values.is_emergency_leave || false,
        documentation_provided: fileList.length > 0,
        attachments: fileList.map(f => f.name), // In production, upload files first
        priority: values.priority || 'medium',
      };

      await employeeApi.leaveRequests.create(requestData);
      message.success('Leave request submitted successfully! Pending approval.');
      setIsCreateModalOpen(false);
      form.resetFields();
      fetchLeaveRequests();
    } catch (error: any) {
      console.error('Failed to create leave request:', error);
      const errorMsg = error.response?.data?.leave_policy?.[0] ||
                      error.response?.data?.message ||
                      'Failed to submit leave request';
      message.error(errorMsg);
    }
  };

  // ============================================================================
  // HANDLERS - Approve/Reject
  // ============================================================================

  const handleApprove = async (request: LeaveRequest) => {
    try {
      await employeeApi.leaveRequests.approve(request.id, 'Approved');
      message.success('Leave request approved');
      fetchLeaveRequests();
    } catch (error) {
      console.error('Failed to approve:', error);
      message.error('Failed to approve leave request');
    }
  };

  const handleReject = async (request: LeaveRequest) => {
    Modal.confirm({
      title: 'Reject Leave Request',
      content: (
        <div>
          <p>Are you sure you want to reject this leave request?</p>
          <Input.TextArea
            placeholder="Reason for rejection (required)"
            id="reject-reason"
          />
        </div>
      ),
      onOk: async () => {
        const reason = (document.getElementById('reject-reason') as HTMLTextAreaElement)?.value;
        if (!reason) {
          message.error('Please provide a reason for rejection');
          return;
        }
        try {
          await employeeApi.leaveRequests.reject(request.id, reason);
          message.success('Leave request rejected');
          fetchLeaveRequests();
        } catch (error) {
          console.error('Failed to reject:', error);
          message.error('Failed to reject leave request');
        }
      },
    });
  };

  // ============================================================================
  // VALIDATION - Minimum Notice
  // ============================================================================

  const validateMinimumNotice = () => {
    if (!selectedPolicy || !form.getFieldValue('dateRange')) return null;

    const dateRange = form.getFieldValue('dateRange');
    const isEmergency = form.getFieldValue('is_emergency_leave');

    if (!dateRange || !dateRange[0] || isEmergency) return null;

    const daysUntilLeave = dateRange[0].diff(dayjs(), 'days');

    if (daysUntilLeave < selectedPolicy.minimum_notice_days) {
      return {
        type: 'warning',
        message: `Minimum ${selectedPolicy.minimum_notice_days} days notice required. You provided ${daysUntilLeave} days notice.`,
      };
    }

    return null;
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns: ColumnsType<LeaveRequest> = [
    {
      title: 'Request #',
      dataIndex: 'request_number',
      key: 'request_number',
      width: 150,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div><Text strong>{record.employee_name}</Text></div>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.employee_number}</Text></div>
        </div>
      ),
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      render: (type, record) => (
        <Tag color={LEAVE_TYPE_COLORS[type] || 'default'}>
          {LEAVE_TYPE_ICONS[type]} {record.leave_type_name}
        </Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => (
        <div>
          <div><CalendarOutlined /> {dayjs(record.start_date).format('DD/MM/YYYY')} - {dayjs(record.end_date).format('DD/MM/YYYY')}</div>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.working_days_count} working days</Text></div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && activeTab === 'pending-approval' && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  style={{ color: '#00d084' }}
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => handleReject(record)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRequest(record);
                setIsDetailsDrawerOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const totalRequests = myRequests.length;
  const pendingRequests = myRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = myRequests.filter(r => r.status === 'approved').length;
  const myApprovalsCount = pendingApproval.length;

  // ============================================================================
  // RENDER
  // ============================================================================

  const noticeValidation = validateMinimumNotice();

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <PageHeader
        title="Leave Management"
        subtitle="Apply for leave, track balances, and manage approvals"
        actions={
          <Space>
            <Button icon={<InfoCircleOutlined />} size="large" onClick={handleShowMyBalances}>
              My Balances
            </Button>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreateLeave}>
              Apply for Leave
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Requests"
            value={totalRequests}
            icon={<FileTextOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
            style={{ borderLeft: '4px solid #00d084' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending"
            value={pendingRequests}
            icon={<ClockCircleOutlined />}
            iconBg="rgba(255, 105, 0, 0.1)"
            style={{ borderLeft: '4px solid #ff6900' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Approved"
            value={approvedRequests}
            icon={<CheckOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
            style={{ borderLeft: '4px solid #00d084' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending My Approval"
            value={myApprovalsCount}
            icon={<ExclamationCircleOutlined />}
            iconBg="rgba(236, 72, 153, 0.1)"
            style={{ borderLeft: '4px solid #ec4899' }}
          />
        </Col>
      </Row>

      {/* Leave Requests Table */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'my-requests',
              label: 'My Requests',
              children: (
                <DataTable
                  columns={columns}
                  dataSource={myRequests}
                  loading={requestsLoading}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'pending-approval',
              label: `Pending My Approval (${myApprovalsCount})`,
              children: (
                <DataTable
                  columns={columns}
                  dataSource={pendingApproval}
                  loading={requestsLoading}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            ...(user?.role && ['hr_manager', 'hr_employee', 'admin'].includes(user.role)
              ? [{
                  key: 'all',
                  label: 'All Requests',
                  children: (
                    <DataTable
                      columns={columns}
                      dataSource={allRequests}
                      loading={requestsLoading}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  ),
                }]
              : []
            ),
          ]}
        />
      </Card>

      {/* CREATE LEAVE REQUEST MODAL - Configuration-Driven Dynamic Form */}
      <Modal
        title="Apply for Leave"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitLeaveRequest}>
          {/* Leave Type Selection */}
          <Form.Item
            label="Leave Type"
            name="leave_policy"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select
              placeholder="Select leave type"
              size="large"
              loading={policiesLoading}
              onChange={handlePolicyChange}
              options={policies.map(policy => ({
                label: (
                  <div>
                    <span style={{ marginRight: '8px' }}>{LEAVE_TYPE_ICONS[policy.leave_type]}</span>
                    {policy.display_name}
                    {policy.is_statutory && <Tag color="blue" style={{ marginLeft: '8px' }}>Statutory</Tag>}
                  </div>
                ),
                value: policy.id,
              }))}
            />
          </Form.Item>

          {/* Gender Error Alert */}
          {genderError && (
            <Alert
              type="error"
              message="Not Eligible"
              description={genderError}
              showIcon
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: '16px' }}
            />
          )}

          {/* Balance Display */}
          {balance && selectedPolicy && !genderError && (
            <Alert
              type="info"
              message={
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    Available {selectedPolicy.display_name}: {balance.available_balance} days
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    Total Accrued: {balance.total_accrued} days |
                    Used: {balance.total_used} days |
                    Pending: {balance.total_pending} days
                  </div>
                </div>
              }
              icon={<InfoCircleOutlined />}
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {balanceLoading && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Spin tip="Loading balance..." />
            </div>
          )}

          {/* Date Range */}
          <Form.Item
            label="Leave Period"
            name="dateRange"
            rules={[{ required: true, message: 'Please select leave dates' }]}
          >
            <RangePicker
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              onChange={handleDateRangeChange}
              disabled={!!genderError}
            />
          </Form.Item>

          {/* Calculated Working Days */}
          {calculatedDays && (
            <Alert
              type="success"
              message={`Calculated Leave Days: ${calculatedDays.working_days} working days`}
              description={
                <div style={{ fontSize: '12px' }}>
                  Total: {calculatedDays.total_days} calendar days
                  {calculatedDays.weekends_excluded > 0 && ` | Weekends excluded: ${calculatedDays.weekends_excluded}`}
                  {calculatedDays.public_holidays_excluded > 0 && ` | Public holidays excluded: ${calculatedDays.public_holidays_excluded}`}
                </div>
              }
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {calculatingDays && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Spin tip="Calculating working days..." />
            </div>
          )}

          {/* Minimum Notice Warning */}
          {noticeValidation && (
            <Alert
              type={noticeValidation.type as any}
              message="Notice Period"
              description={noticeValidation.message}
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {/* Half Day Option */}
          {selectedPolicy?.supports_half_days && (
            <Form.Item name="is_half_day" valuePropName="checked">
              <Checkbox>This is a half-day leave</Checkbox>
            </Form.Item>
          )}

          {/* Emergency Leave */}
          <Form.Item name="is_emergency_leave" valuePropName="checked">
            <Checkbox>Emergency leave (bypasses minimum notice requirement)</Checkbox>
          </Form.Item>

          {/* Special Leave Trigger - Only for Special Leave */}
          {selectedPolicy?.leave_type === 'special' && (
            <Form.Item
              label="Special Leave Reason"
              name="special_leave_trigger"
              rules={[{ required: true, message: 'Please select statutory trigger reason' }]}
            >
              <Select
                placeholder="Select reason"
                size="large"
                options={SPECIAL_LEAVE_TRIGGERS}
              />
            </Form.Item>
          )}

          {/* Reason */}
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <TextArea
              rows={4}
              placeholder="Explain why you need this leave..."
              disabled={!!genderError}
            />
          </Form.Item>

          {/* Handover Notes */}
          <Form.Item
            label="Handover Notes"
            name="handover_notes"
            tooltip="Provide details about work handover during your absence"
          >
            <TextArea
              rows={3}
              placeholder="Describe work handover arrangements, pending tasks, or responsibilities to be delegated..."
              disabled={!!genderError}
            />
          </Form.Item>

          {/* Address During Leave */}
          <Form.Item
            label="Address During Leave"
            name="address_during_leave"
            tooltip="Where you can be reached during your leave"
            rules={[{ max: 500, message: 'Address cannot exceed 500 characters' }]}
          >
            <Input
              placeholder="Enter your address while on leave"
              disabled={!!genderError}
            />
          </Form.Item>

          {/* Contact Number During Leave */}
          <Form.Item
            label="Contact Number During Leave"
            name="contact_during_leave"
            tooltip="Phone number where you can be reached"
            rules={[
              { max: 50, message: 'Contact number cannot exceed 50 characters' },
              {
                pattern: /^[\d\s\-+()]+$/,
                message: 'Please enter a valid phone number',
              },
            ]}
          >
            <Input
              placeholder="e.g., +263 77 123 4567"
              disabled={!!genderError}
            />
          </Form.Item>

          {/* Document Upload - Conditional based on policy */}
          {selectedPolicy?.requires_documentation && (
            <Form.Item label="Supporting Documents">
              <Upload
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
                maxCount={5}
                disabled={!!genderError}
              >
                <Button icon={<UploadOutlined />} size="large">
                  Upload Documents ({fileList.length} file{fileList.length !== 1 ? 's' : ''})
                </Button>
              </Upload>
              <Alert
                type={selectedPolicy.documentation_mandatory ? 'warning' : 'info'}
                message={
                  selectedPolicy.documentation_mandatory
                    ? `REQUIRED: ${selectedPolicy.documentation_types?.join(', ')} - You have uploaded ${fileList.length} file(s)`
                    : `Recommended: ${selectedPolicy.documentation_types?.join(', ')}`
                }
                showIcon
                style={{ marginTop: '8px' }}
              />
            </Form.Item>
          )}

          {/* Submit */}
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                disabled={!!genderError}
              >
                Submit Leave Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* My Balances Modal */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            <span>My Leave Balances</span>
          </Space>
        }
        open={isBalancesModalOpen}
        onCancel={() => setIsBalancesModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsBalancesModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={1200}
      >
        <Spin spinning={myBalancesLoading}>
          {myBalances.length === 0 && !myBalancesLoading ? (
            <Alert
              message="No Leave Balances"
              description="You don't have any leave balances yet. Please contact HR to allocate leave to your account."
              type="info"
              showIcon
            />
          ) : (
            <div>
              <Alert
                message="Your Current Leave Balances"
                description={`Showing balances for ${user?.name}${user?.employeeNumber ? ` (${user.employeeNumber})` : ''}`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {myBalances.map((balance) => {
                const leaveType = balance.leave_type;
                const color = LEAVE_TYPE_COLORS[leaveType] || '#8c8c8c';
                const icon = LEAVE_TYPE_ICONS[leaveType] || '📋';
                const usagePercent = balance.total_accrued > 0
                  ? Math.round((balance.total_used / balance.total_accrued) * 100)
                  : 0;

                return (
                  <Card key={balance.policy_id} size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16} align="middle">
                      <Col span={8}>
                        <Space>
                          <span style={{ fontSize: '24px' }}>{icon}</span>
                          <div>
                            <Title level={5} style={{ margin: 0 }}>
                              {balance.policy_name}
                            </Title>
                            <Tag color={color} style={{ marginTop: 4 }}>
                              {balance.leave_type.toUpperCase()}
                            </Tag>
                          </div>
                        </Space>
                      </Col>

                      <Col span={16}>
                        <Row gutter={8}>
                          <Col span={6}>
                            <Statistic
                              title="Accrued"
                              value={balance.total_accrued}
                              suffix="days"
                              valueStyle={{ fontSize: '16px' }}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="Used"
                              value={balance.total_used}
                              suffix="days"
                              valueStyle={{ fontSize: '16px', color: '#ff6900' }}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="Pending"
                              value={balance.total_pending}
                              suffix="days"
                              valueStyle={{ fontSize: '16px', color: '#faad14' }}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="Available"
                              value={balance.available_balance}
                              suffix="days"
                              valueStyle={{ fontSize: '16px', color: '#00d084', fontWeight: 'bold' }}
                            />
                          </Col>
                        </Row>

                        <div style={{ marginTop: 12 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Usage: {usagePercent}%
                          </Text>
                          <Progress
                            percent={usagePercent}
                            strokeColor={color}
                            status="active"
                            showInfo={false}
                            style={{ marginTop: 4 }}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};
