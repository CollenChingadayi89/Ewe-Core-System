import { useState } from 'react';
import { Modal, Form, Input, Alert } from 'antd';
import { approvalRequestApi } from '../../services/api/approval';

interface CancelRequestModalProps {
  /** Approval request to cancel; null when closed */
  approvalRequestId: string | null;
  /** Shown in the title, e.g. "PAY-2026-000012" */
  requestLabel?: string;
  onClose: () => void;
  onCancelled: () => void;
}

/**
 * The requester withdraws a request before its final approval. A reason is required,
 * and everyone in the approval workflow is notified.
 */
export const CancelRequestModal = ({ approvalRequestId, requestLabel, onClose, onCancelled }: CancelRequestModalProps) => {
  const [form] = Form.useForm<{ reason: string }>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async ({ reason }: { reason: string }) => {
    if (!approvalRequestId) return;
    setSubmitting(true);
    try {
      await approvalRequestApi.cancel(approvalRequestId, { reason: reason.trim() });
      onCancelled();
    } catch {
      // The API client already shows the server's message; keep the modal open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={requestLabel ? `Cancel request · ${requestLabel}` : 'Cancel request'}
      open={approvalRequestId !== null}
      onCancel={onClose}
      onOk={form.submit}
      okText="Cancel Request"
      cancelText="Keep Request"
      okButtonProps={{ danger: true }}
      confirmLoading={submitting}
      width="min(520px, 100vw)"
      destroyOnHidden
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        title="Cancelling stops the approval process. Everyone in the approval workflow will be notified with your reason. This can't be undone."
      />
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Reason for cancellation"
          name="reason"
          rules={[{ required: true, whitespace: true, message: 'Tell the approvers why you are cancelling' }]}
        >
          <Input.TextArea rows={4} maxLength={1000} showCount autoFocus placeholder="e.g. Supplier withdrew the quotation" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
