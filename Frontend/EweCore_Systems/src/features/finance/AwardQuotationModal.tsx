import { useState } from 'react';
import { Modal, Form, Radio, Input, Space, Button, Typography, Alert } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { DocumentPreviewModal } from '../../components/common';
import { procurementApi, type ProcurementDetailResponse } from '../../services/api/procurement';

const { Text } = Typography;

interface AwardFormValues {
  quotation_index: number;
  reason: string;
  comments?: string;
}

interface AwardQuotationModalProps {
  /** Procurement at its final approval stage; null when closed */
  procurement: Pick<ProcurementDetailResponse, 'id' | 'request_number' | 'quotations'> | null;
  onClose: () => void;
  onAwarded: (updated: ProcurementDetailResponse) => void;
}

/**
 * Final approver picks the winning quotation, gives a reason and approves.
 * Approval creates the procurement record for the winning vendor.
 */
export const AwardQuotationModal = ({ procurement, onClose, onAwarded }: AwardQuotationModalProps) => {
  const [form] = Form.useForm<AwardFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<{ index: number; fileName: string } | null>(null);

  const handleFinish = async (values: AwardFormValues) => {
    if (!procurement) return;
    setSubmitting(true);
    try {
      const updated = await procurementApi.award(procurement.id, values);
      onAwarded(updated);
    } catch {
      // The API client already shows the server's message; keep the modal open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={procurement ? `Select winning quotation · ${procurement.request_number}` : 'Select winning quotation'}
      open={procurement !== null}
      onCancel={onClose}
      onOk={form.submit}
      okText="Award & Approve"
      confirmLoading={submitting}
      width="min(640px, 100vw)"
      destroyOnHidden
    >
      {procurement && (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="This is the final approval. The chosen supplier gets a procurement record, and the requester is asked to add the payment terms."
          />
          <Form.Item name="quotation_index" rules={[{ required: true, message: 'Select the winning quotation' }]}>
            <Radio.Group style={{ width: '100%' }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                {procurement.quotations.map((quotation, index) => (
                  <Radio key={index} value={index} disabled={!quotation.vendor_id} style={{ width: '100%' }}>
                    <Space wrap>
                      <Text strong>{quotation.vendor_name}</Text>
                      {quotation.has_document && (
                        <Button
                          size="small"
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={(event) => {
                            event.preventDefault();
                            setPreview({ index, fileName: quotation.file_name || `Quotation ${index + 1}` });
                          }}
                        >
                          View quotation
                        </Button>
                      )}
                      {!quotation.vendor_id && <Text type="secondary">(not linked to a vendor record)</Text>}
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="Reason for selection"
            name="reason"
            rules={[{ required: true, whitespace: true, message: 'Explain why this quotation was chosen' }]}
          >
            <Input.TextArea rows={3} maxLength={1000} showCount placeholder="e.g. Lowest price that meets the specification; delivery in 5 days" />
          </Form.Item>
          <Form.Item label="Approval comments" name="comments">
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      )}

      {procurement && preview && (
        <DocumentPreviewModal
          key={preview.index}
          open
          onClose={() => setPreview(null)}
          fileName={preview.fileName}
          loadDocument={() => procurementApi.getQuotationDocument(procurement.id, preview.index)}
        />
      )}
    </Modal>
  );
};
