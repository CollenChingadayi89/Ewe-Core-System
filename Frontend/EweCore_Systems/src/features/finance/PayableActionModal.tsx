import { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Descriptions } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { MarkPaidRequest, PayableListResponse } from '../../services/api/payables';
import { PAYMENT_METHODS, describePayTo, formatMoney } from './payableUtils';

const { TextArea } = Input;

export type PayableAction = 'approve' | 'reject' | 'pay';

interface ActionFormValues {
  comments?: string;
  paid_date?: Dayjs;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
}

interface PayableActionModalProps {
  payable: PayableListResponse | null;
  action: PayableAction;
  onClose: () => void;
  onApprove: (payable: PayableListResponse, comments: string) => Promise<void>;
  onReject: (payable: PayableListResponse, comments: string) => Promise<void>;
  onPay: (payable: PayableListResponse, data: MarkPaidRequest) => Promise<void>;
}

const TITLES: Record<PayableAction, string> = {
  approve: 'Approve Payable',
  reject: 'Reject Payable',
  pay: 'Record Payment',
};

const OK_TEXT: Record<PayableAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
  pay: 'Confirm Payment',
};

/** Approve / reject (workflow approval stages) or record payment (workflow Pay stage). */
export const PayableActionModal = ({ payable, action, onClose, onApprove, onReject, onPay }: PayableActionModalProps) => {
  const [form] = Form.useForm<ActionFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: ActionFormValues) => {
    if (!payable) return;
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await onApprove(payable, values.comments || '');
      } else if (action === 'reject') {
        await onReject(payable, values.comments || '');
      } else {
        await onPay(payable, {
          paid_date: values.paid_date?.format('YYYY-MM-DD'),
          payment_method: values.payment_method!,
          payment_reference: values.payment_reference || undefined,
          notes: values.notes || undefined,
        });
      }
      onClose();
    } catch {
      // The API client already shows the server's message; keep the modal open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={TITLES[action]}
      open={payable !== null}
      onCancel={onClose}
      onOk={form.submit}
      okText={OK_TEXT[action]}
      okButtonProps={{ danger: action === 'reject' }}
      confirmLoading={submitting}
      width="min(520px, 100vw)"
      destroyOnHidden
    >
      {payable && (
        <>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Payable">{payable.payable_number}</Descriptions.Item>
            <Descriptions.Item label="Payee">{payable.payee_name} ({payable.payee_reference})</Descriptions.Item>
            <Descriptions.Item label="For">{payable.category_display}</Descriptions.Item>
            <Descriptions.Item label="Amount">{formatMoney(payable.currency, payable.total_amount)}</Descriptions.Item>
            <Descriptions.Item label="Pay via">{payable.payment_method || '—'}</Descriptions.Item>
            {describePayTo(payable) && (
              <Descriptions.Item label="Pay to"><strong>{describePayTo(payable)}</strong></Descriptions.Item>
            )}
          </Descriptions>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{ paid_date: dayjs(), payment_method: payable.payment_method || undefined }}
          >
            {action === 'pay' ? (
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
              </>
            ) : (
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
          </Form>
        </>
      )}
    </Modal>
  );
};
