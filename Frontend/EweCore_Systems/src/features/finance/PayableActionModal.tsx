import { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Descriptions, Checkbox, Divider, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { MarkPaidRequest, PayableListResponse, RescheduleRequest } from '../../services/api/payables';
import { PAYMENT_METHODS, describePayTo, formatDate, formatMoney } from './payableUtils';

const { TextArea } = Input;
const { Text } = Typography;

export type PayableAction = 'approve' | 'reject' | 'pay' | 'reschedule';

interface ActionFormValues {
  comments?: string;
  paid_date?: Dayjs;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  collector_id_verified?: boolean;
  // Approver moves the payment/collection date (e.g. funds not available yet)
  new_collection_date?: Dayjs;
  reschedule_reason?: string;
}

interface PayableActionModalProps {
  payable: PayableListResponse | null;
  action: PayableAction;
  onClose: () => void;
  onApprove: (payable: PayableListResponse, comments: string) => Promise<void>;
  onReject: (payable: PayableListResponse, comments: string) => Promise<void>;
  onPay: (payable: PayableListResponse, data: MarkPaidRequest) => Promise<void>;
  onReschedule: (payable: PayableListResponse, data: RescheduleRequest) => Promise<void>;
}

const TITLES: Record<PayableAction, string> = {
  approve: 'Approve Payable',
  reject: 'Reject Payable',
  pay: 'Record Payment',
  reschedule: 'Change Payment Date',
};

const OK_TEXT: Record<PayableAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
  pay: 'Confirm Payment',
  reschedule: 'Change Date',
};

/**
 * Approve / reject (workflow approval stages), record payment (Pay stage), or move the
 * payment/collection date. Approvers can also suggest a new date while approving.
 */
export const PayableActionModal = ({
  payable, action, onClose, onApprove, onReject, onPay, onReschedule,
}: PayableActionModalProps) => {
  const [form] = Form.useForm<ActionFormValues>();
  const [submitting, setSubmitting] = useState(false);
  // Set once the new date is saved, so a retry after a failed approval doesn't move it twice
  const [dateSaved, setDateSaved] = useState(false);
  const newDate = Form.useWatch('new_collection_date', form);

  const handleFinish = async (values: ActionFormValues) => {
    if (!payable) return;
    setSubmitting(true);
    try {
      // A new date is saved first, so the next approver/payer sees it
      if ((action === 'approve' || action === 'reschedule') && values.new_collection_date && !dateSaved) {
        await onReschedule(payable, {
          collection_date: values.new_collection_date.format('YYYY-MM-DD'),
          reason: (values.reschedule_reason || '').trim(),
        });
        setDateSaved(true);
      }
      if (action === 'approve') {
        await onApprove(payable, values.comments || '');
      } else if (action === 'reject') {
        await onReject(payable, values.comments || '');
      } else if (action === 'pay') {
        await onPay(payable, {
          paid_date: values.paid_date?.format('YYYY-MM-DD'),
          payment_method: values.payment_method!,
          payment_reference: values.payment_reference || undefined,
          notes: values.notes || undefined,
          collector_id_verified: Boolean(values.collector_id_verified),
        });
      }
      onClose();
    } catch {
      // The API client already shows the server's message; keep the modal open.
    } finally {
      setSubmitting(false);
    }
  };

  const dateFields = payable && (
    <>
      <Form.Item
        label={action === 'reschedule' ? 'New payment / collection date' : 'Suggest a different payment / collection date (optional)'}
        name="new_collection_date"
        rules={action === 'reschedule' ? [{ required: true, message: 'Pick the new date' }] : []}
        extra={`Currently ${formatDate(payable.collection_date)}${payable.requested_collection_date
          && payable.requested_collection_date !== payable.collection_date
          ? ` (originally requested ${formatDate(payable.requested_collection_date)})` : ''}`}
      >
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          disabledDate={(date) => date.isBefore(dayjs(), 'day')}
        />
      </Form.Item>
      {(action === 'reschedule' || newDate) && (
        <Form.Item
          label="Reason for the new date"
          name="reschedule_reason"
          rules={[{ required: true, whitespace: true, message: 'Explain why the date is changing' }]}
        >
          <TextArea rows={2} maxLength={1000} placeholder="e.g. Funds will be available from the 15th; the payout needs 7 days' notice" />
        </Form.Item>
      )}
      {(action === 'reschedule' || newDate) && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          The requester (to inform the payee) and the rest of the approval workflow will be notified.
        </Text>
      )}
    </>
  );

  return (
    <Modal
      title={TITLES[action]}
      open={payable !== null}
      onCancel={onClose}
      onOk={form.submit}
      okText={action === 'approve' && newDate ? 'Change Date & Approve' : OK_TEXT[action]}
      okButtonProps={{ danger: action === 'reject' }}
      confirmLoading={submitting}
      width="min(560px, 100vw)"
      destroyOnHidden
    >
      {payable && (
        <>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Payable">{payable.payable_number}</Descriptions.Item>
            <Descriptions.Item label="Payee">{payable.payee_name} ({payable.payee_reference})</Descriptions.Item>
            <Descriptions.Item label="For">{payable.category_display}</Descriptions.Item>
            <Descriptions.Item label="Amount">{formatMoney(payable.currency, payable.total_amount)}</Descriptions.Item>
            <Descriptions.Item label="Payment / collection date">{formatDate(payable.collection_date)}</Descriptions.Item>
            <Descriptions.Item label="Pay via">{payable.payment_method || '—'}</Descriptions.Item>
            {describePayTo(payable) && (
              <Descriptions.Item label="Pay to"><strong>{describePayTo(payable)}</strong></Descriptions.Item>
            )}
            {payable.in_person_collection && (
              <Descriptions.Item label="Collected by">
                <strong>{payable.collector_name}</strong> · ID {payable.collector_id_number}
                {payable.collector_phone ? ` · ${payable.collector_phone}` : ''}
              </Descriptions.Item>
            )}
            {payable.procurement_installments.length > 0 && (
              <Descriptions.Item label="Settles">
                {payable.procurement_installments.map((i) => `${i.record_number} ${i.label}`).join(', ')}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{ paid_date: dayjs(), payment_method: payable.payment_method || undefined }}
          >
            {action === 'pay' && (
              <>
                <Form.Item label="Paid Date" name="paid_date" rules={[{ required: true, message: 'Select the payment date' }]}>
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    disabledDate={(date) => date.isAfter(dayjs(), 'day')}
                  />
                </Form.Item>
                <Form.Item label="Payment Method" name="payment_method" rules={[{ required: true, message: 'Select the payment method' }]}>
                  <Select options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />
                </Form.Item>
                <Form.Item
                  label="Payment Reference"
                  name="payment_reference"
                  tooltip="Bank transaction, mobile money or cheque number"
                >
                  <Input maxLength={50} placeholder="e.g. TXN-123456" />
                </Form.Item>
                <Form.Item label="Notes" name="notes">
                  <TextArea rows={2} maxLength={300} />
                </Form.Item>
                {payable.in_person_collection && (
                  <Form.Item
                    name="collector_id_verified"
                    valuePropName="checked"
                    rules={[{
                      validator: async (_, checked) => {
                        if (!checked) throw new Error("Confirm you checked the collector's ID");
                      },
                    }]}
                  >
                    <Checkbox>
                      I checked {payable.collector_name}'s ID ({payable.collector_id_number}) before handing over the payment
                    </Checkbox>
                  </Form.Item>
                )}
              </>
            )}

            {action === 'reschedule' && dateFields}

            {(action === 'approve' || action === 'reject') && (
              <Form.Item
                label="Comments"
                name="comments"
                rules={action === 'reject' ? [{ required: true, message: 'Give a reason for rejecting' }] : []}
              >
                <TextArea
                  rows={3}
                  maxLength={500}
                  showCount
                  placeholder={action === 'reject' ? 'Reason for rejection' : 'Optional comments'}
                />
              </Form.Item>
            )}

            {action === 'approve' && (
              <>
                <Divider style={{ margin: '8px 0 16px' }} />
                {dateFields}
              </>
            )}
          </Form>
        </>
      )}
    </Modal>
  );
};
