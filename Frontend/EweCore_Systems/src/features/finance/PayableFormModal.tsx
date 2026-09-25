import { useState } from 'react';
import {
  Modal, Form, Radio, Select, Input, InputNumber, DatePicker, Row, Col, Alert, Button, Space, Tooltip, Divider,
  Switch, Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  PAYABLE_CURRENCIES,
  vendorApi,
  type PayableCollectionDetails,
  type PayableCreateRequest,
  type PayablePayToDetails,
  type PayeeType,
  type VendorCreateRequest,
  type VendorDetailResponse,
  type VendorListResponse,
} from '../../services/api/payables';
import { procurementRecordApi, type OutstandingInstallment } from '../../services/api/procurement';
import type { MemberLookup } from '../../services/api/members';
import { MemberSearchSelect } from './MemberSearchSelect';
import { QuickAddMemberModal } from './QuickAddMemberModal';
import { VendorSelect } from './VendorSelect';
import { InstallmentPicker } from './InstallmentPicker';
import { BANK_TRANSFER, MOBILE_MONEY, PAYMENT_METHODS, categoriesFor, formatMoney } from './payableUtils';

const { TextArea } = Input;
const { Title, Text } = Typography;

const PROCUREMENT_CATEGORY = 'procurement';

interface PayableFormValues extends PayablePayToDetails, PayableCollectionDetails {
  payee_type: PayeeType;
  vendor?: string;
  member?: string;
  procurement_installments?: string[];
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

const SectionTitle = ({ children }: { children: string }) => (
  <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>{children}</Title>
);

export const PayableFormModal = ({ open, vendors, onClose, onSubmit, onAddVendor }: PayableFormModalProps) => {
  const [form] = Form.useForm<PayableFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addedMembers, setAddedMembers] = useState<MemberLookup[]>([]);
  const [installments, setInstallments] = useState<OutstandingInstallment[]>([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const payeeType = Form.useWatch('payee_type', form) ?? 'vendor';
  const vendorId = Form.useWatch('vendor', form);
  const currency = Form.useWatch('currency', form) ?? 'ZWG';
  const paymentMethod = Form.useWatch('payment_method', form);
  const inPerson = Form.useWatch('in_person_collection', form) ?? false;
  const selectedInstallmentIds = Form.useWatch('procurement_installments', form) ?? [];
  const settlingInstallments = selectedInstallmentIds.length > 0;

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

  const loadInstallments = async (vendorId: string) => {
    setInstallmentsLoading(true);
    try {
      setInstallments(await procurementRecordApi.outstandingInstallments(vendorId));
    } catch {
      setInstallments([]);
    } finally {
      setInstallmentsLoading(false);
    }
  };

  const handleVendorChanged = async (vendorId: string) => {
    form.setFieldsValue({ procurement_installments: [] });
    loadInstallments(vendorId);
    try {
      prefillFromVendor(await vendorApi.retrieve(vendorId));
    } catch {
      // Pre-filling is a convenience; the details can still be typed in
    }
  };

  /** Settling installments fixes the category, currency and amount (the backend enforces the same). */
  const handleInstallmentsChanged = (ids: string[]) => {
    const selected = installments.filter((i) => ids.includes(i.id));
    if (selected.length === 0) {
      form.setFieldsValue({ category: undefined, amount: undefined });
      return;
    }
    const total = selected.reduce((sum, i) => sum + Number(i.outstanding), 0);
    const earliestDue = [...selected].sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
    form.setFieldsValue({
      category: PROCUREMENT_CATEGORY,
      currency: selected[0].currency,
      amount: Math.round(total * 100) / 100,
      tax_amount: 0,
      description: form.getFieldValue('description') || selected
        .map((i) => `${i.record_number} ${i.label} (${i.item_description})`)
        .join('; ')
        .slice(0, 500),
    });
    if (!form.getFieldValue('due_date')) {
      form.setFieldsValue({ due_date: dayjs(earliestDue.due_date) });
    }
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
    setInstallments([]);
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
        procurement_installments: isVendor && settlingInstallments ? values.procurement_installments : undefined,
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
        in_person_collection: Boolean(values.in_person_collection),
        collector_name: values.in_person_collection ? values.collector_name : undefined,
        collector_id_number: values.in_person_collection ? values.collector_id_number : undefined,
        collector_phone: values.in_person_collection ? values.collector_phone : undefined,
        ...Object.fromEntries(PAY_TO_FIELDS.map((f) => [f, values[f] || undefined])),
      });
      form.resetFields();
      setInstallments([]);
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
      width="min(1200px, 100vw)"
      style={{ top: 24 }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ payee_type: 'vendor', currency: 'ZWG', priority: 'medium', in_person_collection: false }}
      >
        <Row gutter={32}>
          {/* ------------------------------------------------ Payee & amount */}
          <Col xs={24} lg={12}>
            <SectionTitle>Payee & Amount</SectionTitle>
            <Form.Item label="Who is being paid?" name="payee_type">
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                onChange={() => {
                  form.setFieldsValue({
                    vendor: undefined, member: undefined, category: undefined, procurement_installments: [], ...emptyPayTo,
                  });
                  setInstallments([]);
                }}
                options={[
                  { value: 'vendor', label: 'Vendor / Supplier' },
                  { value: 'member', label: 'SACCO Member' },
                ]}
              />
            </Form.Item>

            {payeeType === 'vendor' ? (
              <Form.Item label="Vendor / Supplier" name="vendor" rules={[{ required: true, message: 'Select the vendor to pay' }]}>
                <VendorSelect
                  vendors={vendors}
                  onAddVendor={onAddVendor}
                  onChange={handleVendorChanged}
                />
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

            {payeeType === 'vendor' && vendorId && (
              <Form.Item
                label="Pending procurement installments"
                name="procurement_installments"
                tooltip="Tick the installments this payment settles. Leave empty for other bills from this vendor."
              >
                <InstallmentPicker
                  installments={installments}
                  loading={installmentsLoading}
                  onChange={handleInstallmentsChanged}
                />
              </Form.Item>
            )}

            <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Select a category' }]}>
              <Select placeholder="Select category" options={categoriesFor(payeeType)} disabled={settlingInstallments} />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item label="Currency" name="currency" rules={[{ required: true }]}>
                  <Select options={PAYABLE_CURRENCIES.map((c) => ({ value: c, label: c }))} disabled={settlingInstallments} />
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
                  extra={settlingInstallments ? 'Total outstanding on the selected installments' : undefined}
                >
                  <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" disabled={settlingInstallments} />
                </Form.Item>
              </Col>
              {payeeType === 'vendor' && (
                <Col xs={24} sm={8}>
                  <Form.Item label={`Tax / VAT (${currency})`} name="tax_amount">
                    <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" disabled={settlingInstallments} />
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
          </Col>

          {/* ------------------------------------------------ Payment */}
          <Col xs={24} lg={12}>
            <SectionTitle>Payment</SectionTitle>
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

            {paymentMethod === BANK_TRANSFER && (
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

            <Divider style={{ margin: '4px 0 16px' }} />
            <Form.Item
              label="In-person collection"
              name="in_person_collection"
              valuePropName="checked"
              tooltip="Someone will come to the office to collect the payment (e.g. cash or cheque). The payer checks their ID before handing it over."
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
            {inPerson && (
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Collector's Name" name="collector_name" rules={[{ required: true, message: 'Who will collect?' }]}>
                    <Input maxLength={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Collector's ID Number" name="collector_id_number" rules={[{ required: true, message: 'Enter their national ID' }]}>
                    <Input maxLength={50} placeholder="e.g. 63-123456A63" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Collector's Phone" name="collector_phone">
                    <Input maxLength={20} placeholder="+263..." />
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
                <Form.Item
                  label={inPerson ? 'Requested Collection Date' : 'Requested Payment Date'}
                  name="collection_date"
                  tooltip={`${inPerson ? 'When the payee would like to come and collect' : 'When the payment should be made'}. `
                    + 'Approvers may suggest a later date (e.g. if funds are not yet available); you will be notified.'}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row gutter={32}>
          <Col xs={24} lg={12}>
            <Form.Item label="Description" name="description" rules={[{ required: true, message: 'Describe what this payment is for' }]}>
              <TextArea
                rows={3}
                maxLength={500}
                showCount
                placeholder={payeeType === 'member' ? 'e.g. 2026 dividend on 50 shares' : 'What is being paid for'}
              />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item label="Notes" name="notes">
              <TextArea rows={3} maxLength={300} showCount placeholder="Optional instructions for approvers or the payer" />
            </Form.Item>
          </Col>
        </Row>

        {settlingInstallments && (
          <Text type="secondary">
            Settling {selectedInstallmentIds.length} installment(s) for {formatMoney(currency, form.getFieldValue('amount') || 0)}.
            When this payable is marked paid, the procurement balance is reduced automatically.
          </Text>
        )}
      </Form>

      <QuickAddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onCreated={handleMemberAdded}
      />
    </Modal>
  );
};
