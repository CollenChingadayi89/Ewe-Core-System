/**
 * Leave Request Details Page
 *
 * Comprehensive view of a single leave request including:
 * - Request details and metadata
 * - Employee information and balance impact
 * - Approval chain progress
 * - Transaction history
 * - Supporting documents
 * - Action buttons (approve, reject, cancel)
 * - Audit trail
 */

import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Button,
  Space,
  Descriptions,
  Timeline,
  Alert,
  Modal,
  Form,
  Input,
  Divider,
  Steps,
  Empty,
  Spin,
  message,
  Progress,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PageHeader, StatusTag } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useLeaveStore } from '../../store/leaveStore';
import type { LeaveRequest } from '../../types';
import type { LeaveTransaction } from '../../types/leave-ledger';
import { mockLeavePolicies } from '../../mock/leave-config';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { TextArea } = Input;

/**
 * Leave type styling
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

const LEAVE_TYPE_ICONS: Record<string, string> = {
  annual: '🏖️',
  sick: '🤒',
  maternity: '🤱',
  paternity: '👶',
  special: '⭐',
  study: '📚',
  unpaid: '💼',
};

export const LeaveDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    allRequests,
    loading,
    fetchAllRequests,
    fetchTransactionHistory,
    approveRequest,
    rejectRequest,
    cancelRequest,
    getLeavePolicy,
  } = useLeaveStore();

  // State
  const [request, setRequest] = useState<LeaveRequest | null>(null);
  const [transactions, setTransactions] = useState<LeaveTransaction[]>([]);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  // Forms
  const [approvalForm] = Form.useForm();
  const [rejectionForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  // Load data
  useEffect(() => {
    fetchAllRequests();
  }, []);

  useEffect(() => {
    if (id && allRequests.length > 0) {
      const foundRequest = allRequests.find((r) => r.id === id);
      setRequest(foundRequest || null);

      if (foundRequest) {
        // Fetch transaction history for this request
        const relatedTransactions = fetchTransactionHistory(
          foundRequest.requestorId,
          foundRequest.data.leaveType
        ).filter((txn) => txn.relatedRequestId === id);
        setTransactions(relatedTransactions);
      }
    }
  }, [id, allRequests]);

  // Handle approve
  const handleApprove = async () => {
    try {
      const values = await approvalForm.validateFields();
      if (!request || !user?.id) return;

      await approveRequest({
        requestId: request.id,
        approverId: user.id,
        comment: values.comment,
      });

      message.success('Leave request approved successfully');
      setApprovalModalVisible(false);
      approvalForm.resetFields();
      fetchAllRequests();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to approve request');
    }
  };

  // Handle reject
  const handleReject = async () => {
    try {
      const values = await rejectionForm.validateFields();
      if (!request || !user?.id) return;

      await rejectRequest({
        requestId: request.id,
        approverId: user.id,
        comment: values.comment,
      });

      message.success('Leave request rejected');
      setRejectionModalVisible(false);
      rejectionForm.resetFields();
      fetchAllRequests();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to reject request');
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    try {
      const values = await cancelForm.validateFields();
      if (!request || !user?.id) return;

      await cancelRequest(request.id, user.id, values.reason);

      message.success('Leave request cancelled');
      setCancelModalVisible(false);
      cancelForm.resetFields();
      fetchAllRequests();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to cancel request');
    }
  };

  if (loading && !request) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px', color: '#8c8c8c' }}>Loading leave request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div>
        <PageHeader
          title="Leave Request Not Found"
          breadcrumbs={[
            { title: 'Human Resources' },
            { title: 'Leave Management', path: '/hr/leaves' },
            { title: 'Details' },
          ]}
        />
        <Card>
          <Empty
            description="The leave request you're looking for doesn't exist or has been deleted."
          >
            <Button type="primary" onClick={() => navigate('/hr/leaves')}>
              Back to Leave Management
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  const policy = getLeavePolicy(request.data.leaveType);
  const canApprove =
    request.status === 'pending' && request.currentApproverId === user?.id;
  const canCancel =
    request.requestorId === user?.id &&
    (request.status === 'pending' || request.status === 'approved');

  // Calculate days until leave starts
  const daysUntilStart = dayjs(request.data.startDate).diff(dayjs(), 'days');
  const isUpcoming = daysUntilStart > 0;
  const isOngoing =
    dayjs().isAfter(dayjs(request.data.startDate)) &&
    dayjs().isBefore(dayjs(request.data.endDate));

  return (
    <div>
      <PageHeader
        title={
          <Space>
            <span>{LEAVE_TYPE_ICONS[request.data.leaveType]}</span>
            <span>Leave Request Details</span>
          </Space>
        }
        subtitle={`Request ID: ${request.id}`}
        breadcrumbs={[
          { title: 'Human Resources' },
          { title: 'Leave Management', path: '/hr/leaves' },
          { title: 'Details' },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/hr/leaves')}>
              Back to List
            </Button>
            {canCancel && (
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => setCancelModalVisible(true)}
              >
                Cancel Request
              </Button>
            )}
            {canApprove && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => setApprovalModalVisible(true)}
                  style={{
                    background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                    border: 'none',
                  }}
                >
                  Approve
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => setRejectionModalVisible(true)}
                >
                  Reject
                </Button>
              </>
            )}
          </Space>
        }
      />

      {/* Status Alert */}
      {isOngoing && request.status === 'approved' && (
        <Alert
          message="Leave In Progress"
          description={`This employee is currently on leave. Expected return date: ${dayjs(
            request.data.endDate
          )
            .add(1, 'day')
            .format('DD/MM/YYYY')}`}
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: '20px' }}
        />
      )}

      {isUpcoming && request.status === 'approved' && (
        <Alert
          message="Upcoming Leave"
          description={`Leave starts in ${daysUntilStart} day${
            daysUntilStart !== 1 ? 's' : ''
          } (${dayjs(request.data.startDate).format('DD/MM/YYYY')})`}
          type="warning"
          showIcon
          icon={<CalendarOutlined />}
          style={{ marginBottom: '20px' }}
        />
      )}

      {request.status === 'rejected' && request.rejectedBy && (
        <Alert
          message="Request Rejected"
          description={`Rejected by ${
            request.approvalChain?.find((s) => s.approverId === request.rejectedBy)
              ?.approverName || 'Unknown'
          } on ${dayjs(request.rejectedDate).format('DD/MM/YYYY HH:mm')}`}
          type="error"
          showIcon
          icon={<CloseOutlined />}
          style={{ marginBottom: '20px' }}
        />
      )}

      {request.data.isEmergencyLeave && (
        <Alert
          message="Emergency Leave Request"
          description="This is an emergency leave request and requires urgent attention."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '20px' }}
          banner
        />
      )}

      <Row gutter={[20, 20]}>
        {/* Left Column - Main Details */}
        <Col xs={24} lg={16}>
          {/* Request Overview */}
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Request Overview</span>
              </Space>
            }
            extra={<StatusTag status={request.status} />}
            style={{ marginBottom: '20px' }}
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Leave Type" span={2}>
                <Space>
                  <Tag
                    color={LEAVE_TYPE_COLORS[request.data.leaveType]}
                    style={{ fontSize: '14px', padding: '4px 12px' }}
                  >
                    {LEAVE_TYPE_ICONS[request.data.leaveType]}{' '}
                    {request.data.leaveType.toUpperCase()}
                  </Tag>
                  {policy?.isStatutory && (
                    <Tag color="blue" icon={<FileProtectOutlined />}>
                      Statutory
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Start Date">
                <Space>
                  <CalendarOutlined />
                  <span>{dayjs(request.data.startDate).format('DD/MM/YYYY')}</span>
                  <span style={{ color: '#8c8c8c' }}>
                    ({dayjs(request.data.startDate).format('dddd')})
                  </span>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="End Date">
                <Space>
                  <CalendarOutlined />
                  <span>{dayjs(request.data.endDate).format('DD/MM/YYYY')}</span>
                  <span style={{ color: '#8c8c8c' }}>
                    ({dayjs(request.data.endDate).format('dddd')})
                  </span>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Total Days">
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {request.data.days} days
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Working Days">
                <Tag color="cyan" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {request.data.workingDaysCount || request.data.days} working days
                </Tag>
              </Descriptions.Item>

              {request.data.specialLeaveTrigger && (
                <Descriptions.Item label="Special Leave Reason" span={2}>
                  <Tag color="purple">{request.data.specialLeaveTrigger}</Tag>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Reason" span={2}>
                <div
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {request.data.reason}
                </div>
              </Descriptions.Item>

              {request.data.handoverNotes && (
                <Descriptions.Item label="Handover Notes" span={2}>
                  <div
                    style={{
                      background: '#f0f9ff',
                      padding: '12px',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {request.data.handoverNotes}
                  </div>
                </Descriptions.Item>
              )}

              {request.data.attachments && request.data.attachments.length > 0 && (
                <Descriptions.Item label="Attachments" span={2}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {request.data.attachments.map((attachment, index) => (
                      <Button
                        key={index}
                        type="link"
                        icon={<DownloadOutlined />}
                        style={{ padding: 0 }}
                      >
                        {attachment}
                      </Button>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Balance Impact */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined />
                <span>Balance Impact</span>
              </Space>
            }
            style={{ marginBottom: '20px' }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#00d084' }}>
                    {request.data.balanceBeforeRequest ?? '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    Balance Before
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#ff4d4f' }}>
                    -{request.data.workingDaysCount || request.data.days}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    Days Deducted
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color:
                        (request.data.balanceAfterRequest ?? 0) < 5 ? '#ff4d4f' : '#52c41a',
                    }}
                  >
                    {request.data.balanceAfterRequest ?? '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    Balance After
                  </div>
                </div>
              </Col>
            </Row>

            {request.data.balanceBeforeRequest !== undefined &&
              request.data.balanceAfterRequest !== undefined && (
                <>
                  <Divider />
                  <Progress
                    percent={Math.round(
                      (request.data.balanceAfterRequest /
                        (request.data.balanceBeforeRequest || 1)) *
                        100
                    )}
                    strokeColor={
                      request.data.balanceAfterRequest < 5 ? '#ff4d4f' : '#52c41a'
                    }
                    format={(percent) => `${percent}% remaining`}
                  />
                </>
              )}
          </Card>

          {/* Approval Chain */}
          <Card
            title={
              <Space>
                <HistoryOutlined />
                <span>Approval Progress</span>
              </Space>
            }
            style={{ marginBottom: '20px' }}
          >
            {request.approvalChain && request.approvalChain.length > 0 ? (
              <Steps
                direction="vertical"
                current={request.approvalChain.findIndex((s) => s.status === 'pending')}
                status={request.status === 'rejected' ? 'error' : undefined}
              >
                {request.approvalChain.map((step) => {
                  let status: 'wait' | 'process' | 'finish' | 'error' = 'wait';
                  if (step.status === 'approved') status = 'finish';
                  else if (step.status === 'rejected') status = 'error';
                  else if (step.status === 'pending') status = 'process';

                  return (
                    <Steps.Step
                      key={step.approverId}
                      status={status}
                      title={
                        <Space>
                          <span>{step.approverName}</span>
                          <Tag>{step.approverRole}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          {step.status === 'approved' && (
                            <div style={{ color: '#52c41a', marginTop: '4px' }}>
                              <CheckOutlined /> Approved on{' '}
                              {step.actionDate
                                ? dayjs(step.actionDate).format('DD/MM/YYYY HH:mm')
                                : '-'}
                            </div>
                          )}
                          {step.status === 'rejected' && (
                            <div style={{ color: '#ff4d4f', marginTop: '4px' }}>
                              <CloseOutlined /> Rejected on{' '}
                              {step.actionDate
                                ? dayjs(step.actionDate).format('DD/MM/YYYY HH:mm')
                                : '-'}
                            </div>
                          )}
                          {step.status === 'pending' && (
                            <div style={{ color: '#ff6900', marginTop: '4px' }}>
                              <ClockCircleOutlined /> Awaiting approval
                            </div>
                          )}
                          {step.comment && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '8px',
                                background: '#f5f5f5',
                                borderRadius: '4px',
                                fontSize: '13px',
                              }}
                            >
                              💬 {step.comment}
                            </div>
                          )}
                        </div>
                      }
                      icon={
                        step.status === 'approved' ? (
                          <CheckOutlined />
                        ) : step.status === 'rejected' ? (
                          <CloseOutlined />
                        ) : step.status === 'pending' ? (
                          <ClockCircleOutlined />
                        ) : (
                          <UserOutlined />
                        )
                      }
                    />
                  );
                })}
              </Steps>
            ) : (
              <Empty description="No approval chain defined" />
            )}
          </Card>

          {/* Transaction History */}
          {transactions.length > 0 && (
            <Card
              title={
                <Space>
                  <HistoryOutlined />
                  <span>Related Transactions</span>
                </Space>
              }
            >
              <Timeline>
                {transactions.map((txn) => {
                  const isCredit = txn.amount > 0;
                  return (
                    <Timeline.Item
                      key={txn.id}
                      color={isCredit ? 'green' : 'red'}
                      dot={isCredit ? <CheckOutlined /> : <CloseOutlined />}
                    >
                      <div>
                        <div style={{ marginBottom: '4px' }}>
                          <Tag color={isCredit ? 'success' : 'error'}>
                            {isCredit ? '+' : ''}
                            {txn.amount} days
                          </Tag>
                          <Tag>{txn.transactionType.toUpperCase()}</Tag>
                          <span style={{ color: '#8c8c8c', fontSize: '12px', marginLeft: '8px' }}>
                            {dayjs(txn.effectiveDate).format('DD/MM/YYYY')}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#595959' }}>{txn.reason}</div>
                        {txn.notes && (
                          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                            {txn.notes}
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>
          )}
        </Col>

        {/* Right Column - Employee Info & Metadata */}
        <Col xs={24} lg={8}>
          {/* Employee Information */}
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Employee Information</span>
              </Space>
            }
            style={{ marginBottom: '20px' }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{request.requestorName}</Descriptions.Item>
              <Descriptions.Item label="Employee ID">{request.requestorId}</Descriptions.Item>
              <Descriptions.Item label="Request Priority">
                <Tag
                  color={
                    request.priority === 'high'
                      ? 'red'
                      : request.priority === 'medium'
                      ? 'orange'
                      : 'blue'
                  }
                >
                  {request.priority?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Request Metadata */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined />
                <span>Request Metadata</span>
              </Space>
            }
            style={{ marginBottom: '20px' }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Request ID">{request.id}</Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(request.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {request.submittedDate
                  ? dayjs(request.submittedDate).format('DD/MM/YYYY HH:mm')
                  : 'Not submitted'}
              </Descriptions.Item>
              {request.approvedDate && (
                <Descriptions.Item label="Approved">
                  {dayjs(request.approvedDate).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {request.rejectedDate && (
                <Descriptions.Item label="Rejected">
                  {dayjs(request.rejectedDate).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Policy Information */}
          {policy && (
            <Card
              title={
                <Space>
                  <FileProtectOutlined />
                  <span>Policy Information</span>
                </Space>
              }
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Leave Type">{policy.displayName}</Descriptions.Item>
                <Descriptions.Item label="Annual Entitlement">
                  {policy.annualEntitlementDays} days
                </Descriptions.Item>
                <Descriptions.Item label="Accrual Method">
                  {policy.accrualMethod}
                </Descriptions.Item>
                <Descriptions.Item label="Pay Status">
                  <Tag color={policy.isPaid ? 'green' : 'red'}>
                    {policy.isPaid ? 'PAID' : 'UNPAID'}
                  </Tag>
                </Descriptions.Item>
                {policy.statutoryReference && (
                  <Descriptions.Item label="Statutory Ref">
                    <Tooltip title={policy.statutoryReference}>
                      <Tag color="blue" icon={<FileProtectOutlined />}>
                        {policy.statutoryReference.split('-')[0]}
                      </Tag>
                    </Tooltip>
                  </Descriptions.Item>
                )}
                {policy.maxAccumulationDays && (
                  <Descriptions.Item label="Maximum Cap">
                    {policy.maxAccumulationDays} days
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>

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
        <Alert
          message={`You are about to approve ${request.data.days} days of ${request.data.leaveType} leave for ${request.requestorName}`}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form form={approvalForm} layout="vertical">
          <Form.Item label="Approval Comment (Optional)" name="comment">
            <TextArea rows={3} placeholder="Add any comments..." />
          </Form.Item>
        </Form>
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
        <Alert
          message="Rejection requires a reason"
          description="Please provide a clear explanation for rejecting this leave request."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
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
      </Modal>

      {/* Cancel Modal */}
      <Modal
        title="Cancel Leave Request"
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          cancelForm.resetFields();
        }}
        onOk={handleCancel}
        okText="Cancel Request"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="Are you sure you want to cancel this leave request?"
          description="This action cannot be undone. Your leave balance will be restored."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            label="Cancellation Reason"
            name="reason"
            rules={[{ required: true, message: 'Please provide a reason for cancellation' }]}
          >
            <TextArea
              rows={4}
              placeholder="Explain why you are cancelling this leave request..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
