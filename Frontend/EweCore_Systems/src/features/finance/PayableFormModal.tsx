import { useState } from 'react';
import { Modal, Form, Radio, Select, Input, InputNumber, DatePicker, Row, Col, Alert, Button, Space, Tooltip, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import {
  PAYABLE_CURRENCIES,
  vendorApi,
  type PayableCreateRequest,
  type PayablePayToDetails,
  type PayeeType,
  type VendorCreateRequest,
  type VendorDetailResponse,
  type VendorListResponse,
} from '../../services/api/payables';
import type { MemberLookup } from '../../services/api/members';
import { MemberSearchSelect } from './MemberSearchSelect';
import { QuickAddVendorModal } from './QuickAddVendorModal';
import { QuickAddMemberModal } from './QuickAddMemberModal';
import { BANK_TRANSFER, MOBILE_MONEY, PAYMENT_METHODS, categoriesFor } from './payableUtils';

const { TextArea } = Input;

interface PayableFormValues extends PayablePayToDetails {
  payee_type: PayeeType;
  vendor?: string;
  member?: string;
  category: string;
  currency: string;
  amount: number;
  tax_amount?: number;
  invoice_number?: string;
  invoice_date?: Dayjs;
  due_date: Dayjs;
  collection_date?: Dayjs;
  payment_method: string;
  priority: string;
  description: string;
  notes?: string;
}

interface PayableFormModalProps {
  open: boolean;
  vendors: VendorListResponse[];
  onClose: () => void;
  onSubmit: (data: PayableCreateRequest) => Promise<void>;
  onAddVendor: (data: VendorCreateRequest) => Promise<VendorDetailResponse>;
}

const PAY_TO_FIELDS: (keyof PayablePayToDetails)[] = [
  'pay_to_bank_name', 'pay_to_bank_branch', 'pay_to_account_number', 'pay_to_account_name', 'pay_to_mobile_number',
];
const emptyPayTo = Object.fromEntries(PAY_TO_FIELDS.map((f) => [f, undefined])) as PayablePayToDetails;

const toIsoDate = (value?: Dayjs) => (value ? value.format('YYYY-MM-DD') : undefined);

export const PayableFormModal = ({ open, vendors, onClose, onSubmit, onAddVendor }: PayableFormModalProps) => {
  const [form] = Form.useForm<PayableFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addedMembers, setAddedMembers] = useState<MemberLookup[]>([]);
  const payeeType = Form.useWatch('payee_type', form) ?? 'vendor';
  const currency = Form.useWatch('currency', form) ?? 'ZWG';
  const paymentMethod = Form.useWatch('payment_method', form);

  /** Pre-fill bank details from the vendor's record, without overwriting anything already typed. */
  const prefillFromVendor = (vendor: VendorDetailResponse) => {
    if (!vendor.bank_name || !vendor.account_number) return;
    const current = form.getFieldsValue(PAY_TO_FIELDS);
    const bankDetails: PayablePayToDetails = {
      pay_to_bank_name: vendor.bank_name,
      pay_to_bank_branch: vendor.branch,
      pay_to_account_number: vendor.account_number,
      pay_to_account_name: vendor.account_holder_name,
    };
    form.setFieldsValue(
      Object.fromEntries(Object.entries(bankDetails).filter(([field]) => !current[field as keyof PayablePayToDetails]))
    );
    if (!form.getFieldValue('payment_method')) {
      form.setFieldsValue({ payment_method: BANK_TRANSFER });
    }
  };

  const handleVendorSelected = async (vendorId: string) => {
    try {
      prefillFromVendor(await vendorApi.retrieve(vendorId));
    } catch {
      // Pre-filling is a convenience; the details can still be typed in
    }
  };

  const handleVendorAdded = (vendor: VendorDetailResponse) => {
    setAddVendorOpen(false);
    form.setFieldsValue({ vendor: vendor.id });
    form.validateFields(['vendor']);
    prefillFromVendor(vendor);
  };

  const handleMemberAdded = (member: MemberLookup) => {
    setAddMemberOpen(false);
    setAddedMembers((current) => [member, ...current]);
    form.setFieldsValue({ member: member.id });
    form.validateFields(['member']);
  };

  const handleClose = () => {
    form.resetFields();
    setAddedMembers([]);
    onClose();
  };

  const handleFinish = async (values: PayableFormValues) => {
    const isVendor = values.payee_type === 'vendor';
    setSubmitting(true);
    try {
      await onSubmit({
        payee_type: values.payee_type,
        vendor: isVendor ? values.vendor : undefined,
        member: isVendor ? undefined : values.member,
        category: values.category,
        currency: values.currency,
        amount: values.amount.toFixed(2),
        tax_amount: isVendor && values.tax_amount ? values.tax_amount.toFixed(2) : '0.00',
        invoice_number: isVendor ? values.invoice_number : undefined,
        invoice_date: isVendor ? toIsoDate(values.invoice_date) : undefined,
        due_date: toIsoDate(values.due_date)!,
        collection_date: toIsoDate(values.collection_date),
        payment_method: values.payment_method,
        priority: values.priority,
        description: values.description,
        notes: values.notes,
        ...Object.fromEntries(PAY_TO_FIELDS.map((f) => [f, values[f] || undefined])),
      });
      form.resetFields();
    } catch {
      // The API client already shows the server's validation message; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="New Payable"
      open={open}
      onCancel={handleClose}
      onOk={form.submit}
      okText="Submit for Approval"
      confirmLoading={submitting}
      width="min(720px, 100vw)"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ payee_type: 'vendor', currency: 'ZWG', priority: 'medium' }}
      >
        <Form.Item label="Who is being paid?" name="payee_type">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            onChange={() => form.setFieldsValue({ vendor: undefined, member: undefined, category: undefined, ...emptyPayTo })}
            options={[
              { value: 'vendor', label: 'Vendor / Supplier' },
              { value: 'member', label: 'SACCO Member' },
            ]}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            {payeeType === 'vendor' ? (
              <Form.Item label="Vendor / Supplier" required>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="vendor" noStyle rules={[{ required: true, message: 'Select the vendor to pay' }]}>
                    <Select
                      showSearch
                      placeholder="Select vendor or supplier"
                      optionFilterProp="label"
                      notFoundContent="No match — use + to add a new vendor"
                      onChange={handleVendorSelected}
                      options={vendors.map((v) => ({
                        value: v.id,
                        label: `${v.company_name} (${v.vendor_code}) · ${v.vendor_type_display}`,
                      }))}
                    />
                  </Form.Item>
                  <Tooltip title="Add a new vendor or supplier">
                    <Button icon={<PlusOutlined />} onClick={() => setAddVendorOpen(true)} aria-label="Add a new vendor" />
                  </Tooltip>
                </Space.Compact>
              </Form.Item>
            ) : (
              <Form.Item label="Member" required>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="member" noStyle rules={[{ required: true, message: 'Select the member to pay' }]}>
                    <MemberSearchSelect knownMembers={addedMembers} />
                  </Form.Item>
                  <Tooltip title="Add a new SACCO member">
                    <Button icon={<PlusOutlined />} onClick={() => setAddMemberOpen(true)} aria-label="Add a new member" />
                  </Tooltip>
                </Space.Compact>
              </Form.Item>
            )}
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Select a category' }]}>
              <Select placeholder="Select category" options={categoriesFor(payeeType)} />
            </Form.Item>
          </Col>
        </Row>


        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Currency" name="currency" rules={[{ required: true }]}>
              <Select options={PAYABLE_CURRENCIES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={payeeType === 'vendor' ? 8 : 16}>
            <Form.Item
              label={`Amount (${currency})`}
              name="amount"
              rules={[
                { required: true, message: 'Enter the amount' },
                { type: 'number', min: 0.01, message: 'Amount must be greater than zero' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
          {payeeType === 'vendor' && (
            <Col xs={24} sm={8}>
              <Form.Item label={`Tax / VAT (${currency})`} name="tax_amount">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
              </Form.Item>
            </Col>
          )}
        </Row>

        {payeeType === 'vendor' && (
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Invoice Number" name="invoice_number">
                <Input placeholder="e.g. INV-2026-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Invoice Date" name="invoice_date" rules={[{ required: true, message: 'Select the invoice date' }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Due Date" name="due_date" rules={[{ required: true, message: 'Select the due date' }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Scheduled Payment Date" name="collection_date" tooltip="When the payment is planned to be made">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Payment Method" name="payment_method" rules={[{ required: true, message: 'Select a payment method' }]}>
              <Select placeholder="Select payment method" options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start" plain style={{ margin: '4px 0 16px' }}>Pay to</Divider>
        {paymentMethod === BANK_TRANSFER && (
          <>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Bank Name" name="pay_to_bank_name" rules={[{ required: true, message: 'Enter the bank' }]}>
                  <Input maxLength={100} placeholder="e.g. CBZ Bank" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Branch" name="pay_to_bank_branch">
                  <Input maxLength={100} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Account Number" name="pay_to_account_number" rules={[{ required: true, message: 'Enter the account number' }]}>
                  <Input maxLength={50} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Account Holder" name="pay_to_account_name" rules={[{ required: true, message: 'Enter the account holder' }]}>
                  <Input maxLength={100} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
        {paymentMethod === MOBILE_MONEY && (
          <Form.Item
            label="Mobile Money Number"
            name="pay_to_mobile_number"
            rules={[{ required: true, message: 'Enter the mobile money number' }]}
            tooltip="EcoCash, OneMoney or InnBucks number to send the money to"
          >
            <Input maxLength={20} placeholder="+263..." />
          </Form.Item>
        )}
        {!paymentMethod && (
          <Alert type="info" showIcon style={{ marginBottom: 16 }} title="Choose a payment method to enter where the money should go." />
        )}
        {paymentMethod && paymentMethod !== BANK_TRANSFER && paymentMethod !== MOBILE_MONEY && (
          <Alert type="info" showIcon style={{ marginBottom: 16 }} title={`${paymentMethod}: no account details needed.`} />
        )}

        <Form.Item label="Description" name="description" rules={[{ required: true, message: 'Describe what this payment is for' }]}>
          <TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder={payeeType === 'member' ? 'e.g. 2026 dividend on 50 shares' : 'What is being paid for'}
          />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <TextArea rows={2} maxLength={300} showCount placeholder="Optional instructions for approvers or the payer" />
        </Form.Item>
      </Form>

      <QuickAddVendorModal
        open={addVendorOpen}
        onClose={() => setAddVendorOpen(false)}
        onCreate={onAddVendor}
        onCreated={handleVendorAdded}
      />
      <QuickAddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onCreated={handleMemberAdded}
      />
    </Modal>
  );
};
