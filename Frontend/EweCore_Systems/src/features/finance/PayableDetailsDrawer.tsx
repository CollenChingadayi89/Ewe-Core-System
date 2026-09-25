import { useEffect, useState, type ReactNode } from 'react';
import { Drawer, Descriptions, Tag, Typography, Steps, Spin, Alert, Button, Space, Table } from 'antd';
import { CalendarOutlined, CheckOutlined, CloseOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons';
import { StatusTag } from '../../components/common';
import { payableApi, type PayableDetailResponse, type PayableListResponse } from '../../services/api/payables';
import { approvalRequestApi, type ApprovalRequestDetailResponse } from '../../services/api/approval';
import { BANK_TRANSFER, MOBILE_MONEY, PRIORITY_COLORS, canApproveOrReject, formatDate, formatMoney } from './payableUtils';
import type { PayableAction } from './PayableActionModal';

const { Text, Title, Paragraph } = Typography;

interface PayableDetailsDrawerProps {
  /** The list row; full details and approval history are loaded when the drawer opens. */
  payable: PayableListResponse | null;
  onClose: () => void;
  onAction: (payable: PayableListResponse, action: PayableAction) => void;
  /** Provided when the current user (the submitter) can cancel this payable */
  onCancelRequest?: (payable: PayableListResponse) => void;
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ marginBottom: 24 }}>
    <Title level={5} style={{ marginBottom: 12 }}>{title}</Title>
    {children}
  </section>
);

const ACTION_LABELS: Record<string, string> = {
  verify: 'Verify', certify: 'Certify', recommend: 'Recommend', approve: 'Approve', pay: 'Pay', review: 'Review',
};

/**
 * Mount one instance per payable (`key={payable.id}`) so each opens in the loading state.
 */
export const PayableDetailsDrawer = ({ payable, onClose, onAction, onCancelRequest }: PayableDetailsDrawerProps) => {
  const [detail, setDetail] = useState<PayableDetailResponse | null>(null);
  const [approval, setApproval] = useState<ApprovalRequestDetailResponse | null>(null);
  const [failed, setFailed] = useState(false);

  const payableId = payable?.id;
  const approvalId = payable?.approval?.id;
  // Re-load when the row changes (e.g. after an approval action refreshes it)
  const version = payable?.updated_at;

  useEffect(() => {
    if (!payableId) return;
    let cancelled = false;
    Promise.all([
      payableApi.retrieve(payableId),
      approvalId ? approvalRequestApi.retrieve(approvalId) : Promise.resolve(null),
    ])
      .then(([payableDetail, approvalDetail]) => {
        if (cancelled) return;
        setDetail(payableDetail);
        setApproval(approvalDetail);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [payableId, approvalId, version]);

  const renderApprovalSteps = () => {
    const stages = approval?.workflow_details?.stages ?? [];
    if (!approval || stages.length === 0) {
      return <Text type="secondary">No approval workflow information.</Text>;
    }
    const isOpen = approval.status === 'pending' || approval.status === 'in_progress';
    return (
      <Steps
        orientation="vertical"
        size="small"
        current={Math.max(0, approval.current_stage - 1)}
        status={approval.status === 'rejected' ? 'error' : approval.status === 'approved' ? 'finish' : 'process'}
        items={stages.map((stage) => {
          const steps = approval.approval_steps.filter((s) => s.stage_number === stage.stage_number);
          const decided = steps.find((s) => s.status === 'approved' || s.status === 'rejected');
          const waitingOn = steps.filter((s) => s.status === 'pending').map((s) => s.approver_name).join(', ');
          const action = ACTION_LABELS[stage.action_type || 'approve'] || 'Approve';
          let description: string;
          if (decided) {
            description = `${decided.status === 'approved' ? 'Done' : 'Rejected'} by ${decided.approver_name} on ${formatDate(decided.decision_date, true)}`
              + (decided.comments ? ` — "${decided.comments}"` : '');
          } else if (isOpen && stage.stage_number === approval.current_stage) {
            description = waitingOn ? `Waiting for ${waitingOn}` : 'Waiting';
          } else {
            description = 'Not started';
          }
          return { title: `${stage.stage_name} (${action})`, description };
        })}
      />
    );
  };

  const renderBody = () => {
    if (failed) {
      return <Alert type="error" showIcon title="Could not load this payable. Please try again." />;
    }
    if (!detail || !payable) {
      return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;
    }
    return (
      <>
        <Section title="Payment">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            <Descriptions.Item label="Status"><StatusTag status={detail.status} /></Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={PRIORITY_COLORS[detail.priority]}>{detail.priority.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Category">{detail.category_display}</Descriptions.Item>
            <Descriptions.Item label="Total">
              <Text strong>{formatMoney(detail.currency, detail.total_amount)}</Text>
            </Descriptions.Item>
            {Number(detail.tax_amount) > 0 && (
              <>
                <Descriptions.Item label="Amount">{formatMoney(detail.currency, detail.amount)}</Descriptions.Item>
                <Descriptions.Item label="Tax / VAT">{formatMoney(detail.currency, detail.tax_amount)}</Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Due Date">{formatDate(detail.due_date)}</Descriptions.Item>
            <Descriptions.Item label="Payment / Collection">
              {formatDate(detail.collection_date)}
              {detail.requested_collection_date && detail.requested_collection_date !== detail.collection_date && (
                <Text type="secondary"> (requested {formatDate(detail.requested_collection_date)})</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={{ xs: 1, sm: 2 }}>
              <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{detail.description}</Paragraph>
            </Descriptions.Item>
            {detail.notes && (
              <Descriptions.Item label="Notes" span={{ xs: 1, sm: 2 }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{detail.notes}</Paragraph>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Section>

        <Section title={detail.payee_type === 'member' ? 'Member' : 'Vendor'}>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            {detail.member_details && (
              <>
                <Descriptions.Item label="Name">{detail.member_details.full_name}</Descriptions.Item>
                <Descriptions.Item label="Member No.">{detail.member_details.member_number}</Descriptions.Item>
                <Descriptions.Item label="Phone">{detail.member_details.phone}</Descriptions.Item>
                <Descriptions.Item label="Account">{detail.member_details.account_status}</Descriptions.Item>
              </>
            )}
            {detail.vendor_details && (
              <>
                <Descriptions.Item label="Company">{detail.vendor_details.company_name}</Descriptions.Item>
                <Descriptions.Item label="Vendor Code">{detail.vendor_details.vendor_code}</Descriptions.Item>
                <Descriptions.Item label="Contact">{detail.vendor_details.contact_person || '—'}</Descriptions.Item>
                <Descriptions.Item label="Phone">{detail.vendor_details.phone}</Descriptions.Item>
                <Descriptions.Item label="Invoice No.">{detail.invoice_number || '—'}</Descriptions.Item>
                <Descriptions.Item label="Invoice Date">{formatDate(detail.invoice_date)}</Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Section>

        <Section title="Pay To">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            <Descriptions.Item label="Method">{detail.payment_method || '—'}</Descriptions.Item>
            {detail.payment_method === BANK_TRANSFER && (
              <>
                <Descriptions.Item label="Bank">{detail.pay_to_bank_name || '—'}</Descriptions.Item>
                <Descriptions.Item label="Branch">{detail.pay_to_bank_branch || '—'}</Descriptions.Item>
                <Descriptions.Item label="Account No.">{detail.pay_to_account_number || '—'}</Descriptions.Item>
                <Descriptions.Item label="Account Holder">{detail.pay_to_account_name || '—'}</Descriptions.Item>
              </>
            )}
            {detail.payment_method === MOBILE_MONEY && (
              <Descriptions.Item label="Mobile Number">{detail.pay_to_mobile_number || '—'}</Descriptions.Item>
            )}
          </Descriptions>
        </Section>

        {detail.date_changes.length > 0 && (
          <Section title="Payment Date Changes">
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={detail.date_changes}
              columns={[
                { title: 'When', dataIndex: 'created_at', key: 'created_at', render: (d: string) => formatDate(d, true) },
                {
                  title: 'Date', key: 'dates',
                  render: (_, change) => `${formatDate(change.old_date)} → ${formatDate(change.new_date)}`,
                },
                {
                  title: 'By', key: 'by',
                  render: (_, change) => `${change.changed_by_name}${change.stage_name ? ` (${change.stage_name})` : ''}`,
                },
                { title: 'Reason', dataIndex: 'reason', key: 'reason' },
              ]}
            />
          </Section>
        )}

        {detail.in_person_collection && (
          <Section title="In-person Collection">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
              <Descriptions.Item label="Collector">{detail.collector_name}</Descriptions.Item>
              <Descriptions.Item label="ID Number">{detail.collector_id_number}</Descriptions.Item>
              <Descriptions.Item label="Phone">{detail.collector_phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Collection Date">{formatDate(detail.collection_date)}</Descriptions.Item>
              {detail.status === 'paid' && (
                <Descriptions.Item label="ID Checked" span={{ xs: 1, sm: 2 }}>
                  {detail.collector_id_verified ? `Yes, by ${detail.paid_by_name}` : 'No'}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Section>
        )}

        {detail.procurement_installments.length > 0 && (
          <Section title="Procurement Installments Settled">
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={detail.procurement_installments}
              columns={[
                { title: 'Record', dataIndex: 'record_number', key: 'record_number' },
                { title: 'Item', dataIndex: 'item_description', key: 'item_description', ellipsis: true },
                { title: 'Installment', dataIndex: 'label', key: 'label' },
                { title: 'Due', dataIndex: 'due_date', key: 'due_date', render: (d: string) => formatDate(d) },
                {
                  title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right',
                  render: (amount: string) => formatMoney(detail.currency, amount),
                },
              ]}
            />
          </Section>
        )}

        <Section title="Approval">
          <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
            <Descriptions.Item label="Submitted by">
              {detail.submitted_by_name} on {formatDate(detail.created_at, true)}
            </Descriptions.Item>
          </Descriptions>
          {detail.rejection_reason && (
            <Alert type="error" showIcon style={{ marginBottom: 12 }} title={`Rejected: ${detail.rejection_reason}`} />
          )}
          {renderApprovalSteps()}
        </Section>

        {detail.status === 'paid' && (
          <Section title="Payment Record">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
              <Descriptions.Item label="Paid On">{formatDate(detail.paid_date)}</Descriptions.Item>
              <Descriptions.Item label="Paid By">{detail.paid_by_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Method">{detail.payment_method || '—'}</Descriptions.Item>
              <Descriptions.Item label="Reference">{detail.payment_reference || '—'}</Descriptions.Item>
            </Descriptions>
          </Section>
        )}
      </>
    );
  };

  const actions = payable && (
    <Space>
      {onCancelRequest && (
        <Button danger icon={<StopOutlined />} onClick={() => onCancelRequest(payable)}>Cancel Request</Button>
      )}
      {canApproveOrReject(payable) && (
        <>
          <Button danger icon={<CloseOutlined />} onClick={() => onAction(payable, 'reject')}>Reject</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => onAction(payable, 'approve')}>Approve</Button>
        </>
      )}
      {payable.approval?.can_act && (
        <Button icon={<CalendarOutlined />} onClick={() => onAction(payable, 'reschedule')}>Change Date</Button>
      )}
      {payable.can_mark_paid && (
        <Button type="primary" icon={<DollarOutlined />} onClick={() => onAction(payable, 'pay')}>Record Payment</Button>
      )}
    </Space>
  );

  return (
    <Drawer
      title={payable ? `${payable.payable_number} · ${payable.payee_name}` : 'Payable'}
      placement="right"
      size="min(720px, 100vw)"
      open={payable !== null}
      onClose={onClose}
      extra={actions}
      destroyOnHidden
    >
      {renderBody()}
    </Drawer>
  );
};
