import { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { memberApi, type MemberCreateRequest, type MemberLookup } from '../../services/api/members';

const { Text } = Typography;

type MemberFormValues = Omit<MemberCreateRequest, 'date_of_birth'> & { date_of_birth: Dayjs };

interface QuickAddMemberModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the saved member so the caller can select it. */
  onCreated: (member: MemberLookup) => void;
}

/** Register a SACCO member without leaving the current page. The member number is generated. */
export const QuickAddMemberModal = ({ open, onClose, onCreated }: QuickAddMemberModalProps) => {
  const [form] = Form.useForm<MemberFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: MemberFormValues) => {
    setSubmitting(true);
    try {
      const member = await memberApi.create({
        ...values,
        date_of_birth: values.date_of_birth.format('YYYY-MM-DD'),
      });
      form.resetFields();
      onCreated(member);
    } catch {
      // The API client already shows the server's validation message; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add SACCO Member"
      open={open}
      onCancel={onClose}
      onOk={form.submit}
      okText="Add Member"
      confirmLoading={submitting}
      width="min(640px, 100vw)"
      destroyOnHidden
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        A member number (WES-YYYY-###) is assigned automatically. Finance can complete the full profile later.
      </Text>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="First Name" name="first_name" rules={[{ required: true, message: 'Enter the first name' }]}>
              <Input maxLength={50} autoFocus />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Last Name" name="last_name" rules={[{ required: true, message: 'Enter the last name' }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="National ID" name="national_id" rules={[{ required: true, message: 'Enter the national ID' }]}>
              <Input maxLength={50} placeholder="e.g. 63-123456A63" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Date of Birth" name="date_of_birth" rules={[{ required: true, message: 'Select the date of birth' }]}>
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(date) => date.isAfter(dayjs(), 'day')}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Gender" name="gender" rules={[{ required: true, message: 'Select gender' }]}>
              <Select
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'other', label: 'Other' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Enter a phone number' }]}>
              <Input maxLength={20} placeholder="+263..." />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: 'Enter an email' }, { type: 'email', message: 'Enter a valid email' }]}
        >
          <Input maxLength={254} />
        </Form.Item>
        <Form.Item label="Residential Address" name="address" rules={[{ required: true, message: 'Enter the address' }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
