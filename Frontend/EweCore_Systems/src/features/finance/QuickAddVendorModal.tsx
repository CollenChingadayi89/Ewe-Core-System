import { useState } from 'react';
import { Modal, Form, Input, Select, Row, Col, Divider, Typography } from 'antd';
import type { FormRule } from 'antd';
import type { VendorCreateRequest, VendorDetailResponse } from '../../services/api/payables';

const { Text } = Typography;

const VENDOR_TYPES = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'utility', label: 'Utility Company' },
  { value: 'other', label: 'Other' },
];

const BANK_FIELDS = ['bank_name', 'branch', 'account_number', 'account_holder_name'] as const;

interface QuickAddVendorModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: VendorCreateRequest) => Promise<VendorDetailResponse>;
  /** Called with the saved vendor so the caller can select it. */
  onCreated: (vendor: VendorDetailResponse) => void;
}

/** Add a vendor/supplier without leaving the current page. */
export const QuickAddVendorModal = ({ open, onClose, onCreate, onCreated }: QuickAddVendorModalProps) => {
  const [form] = Form.useForm<VendorCreateRequest>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: VendorCreateRequest) => {
    setSubmitting(true);
    try {
      const vendor = await onCreate(values);
      form.resetFields();
      onCreated(vendor);
    } catch {
      // The API client already shows the server's validation message; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  // Bank details are optional, but if any is given all four are needed
  const bankFieldRule: FormRule = ({ getFieldsValue }) => ({
    validator: async (_, value?: string) => {
      const values: Record<string, unknown> = getFieldsValue([...BANK_FIELDS]);
      if (!value && Object.values(values).some(Boolean)) {
        throw new Error('Complete all bank details, or leave them all empty');
      }
    },
  });

  return (
    <Modal
      title="Add Vendor / Supplier"
      open={open}
      onCancel={onClose}
      onOk={form.submit}
      okText="Add Vendor"
      confirmLoading={submitting}
      width="min(640px, 100vw)"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ vendor_type: 'supplier' }}>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item label="Company / Business Name" name="company_name" rules={[{ required: true, message: 'Enter the name' }]}>
              <Input maxLength={200} autoFocus />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Type" name="vendor_type">
              <Select options={VENDOR_TYPES} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Contact Person" name="contact_person">
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Enter a phone number' }]}>
              <Input maxLength={20} placeholder="+263..." />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Enter an email' }, { type: 'email', message: 'Enter a valid email' }]}
            >
              <Input maxLength={254} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Payment Terms" name="payment_terms">
              <Input maxLength={100} placeholder="e.g. Net 30" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Physical Address" name="address" rules={[{ required: true, message: 'Enter the address' }]}>
          <Input.TextArea rows={2} />
        </Form.Item>

        <Divider titlePlacement="start" plain style={{ margin: '8px 0 16px' }}>
          Bank details <Text type="secondary">(optional — used to pre-fill payments)</Text>
        </Divider>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Bank Name" name="bank_name" dependencies={[...BANK_FIELDS]} rules={[bankFieldRule]}>
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Branch" name="branch" dependencies={[...BANK_FIELDS]} rules={[bankFieldRule]}>
              <Input maxLength={100} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Account Number" name="account_number" dependencies={[...BANK_FIELDS]} rules={[bankFieldRule]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Account Holder" name="account_holder_name" dependencies={[...BANK_FIELDS]} rules={[bankFieldRule]}>
              <Input maxLength={100} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
