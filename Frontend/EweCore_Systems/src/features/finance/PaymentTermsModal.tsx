import { useState } from 'react';
import { Modal, Form, InputNumber, Select, DatePicker, Row, Col, Table, Input, Typography, Alert, Button } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  PAYMENT_FREQUENCIES,
  procurementRecordApi,
  type PaymentFrequency,
  type PaymentTermsRequest,
  type ProcurementRecord,
} from '../../services/api/procurement';
import { formatMoney } from './payableUtils';

const { Text } = Typography;

interface TermsFormValues {
  total_amount: number;
  deposit_amount: number;
  installment_count: number;
  frequency: PaymentFrequency;
  first_due_date: Dayjs;
}

interface EditableRow {
  key: number;
  label: string;
  due_date: Dayjs;
  amount: number;
}

interface PaymentTermsModalProps {
  record: ProcurementRecord | null;
  onClose: () => void;
  onSaved: (record: ProcurementRecord) => void;
}

const toRequest = (values: TermsFormValues): PaymentTermsRequest => ({
  total_amount: values.total_amount.toFixed(2),
  deposit_amount: (values.deposit_amount || 0).toFixed(2),
  installment_count: values.installment_count,
  frequency: values.frequency,
  first_due_date: values.first_due_date.format('YYYY-MM-DD'),
});

const cents = (value: number) => Math.round(value * 100);

/**
 * Payment terms for a procurement record: deposit + equal installments. The generated
 * schedule (from the backend) can be adjusted row by row; it must add up to the total.
 */
export const PaymentTermsModal = ({ record, onClose, onSaved }: PaymentTermsModalProps) => {
  const [form] = Form.useForm<TermsFormValues>();
  // Existing schedule when editing terms again (mount one instance per record: key={record.id})
  const [rows, setRows] = useState<EditableRow[]>(() =>
    (record?.installments ?? []).map((inst, key) => ({
      key, label: inst.label, due_date: dayjs(inst.due_date), amount: Number(inst.amount),
    }))
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const currency = record?.currency ?? 'ZWG';

  const total = Form.useWatch('total_amount', form) ?? 0;
  const scheduled = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const balanced = cents(scheduled) === cents(total);

  const generate = async () => {
    const values = await form.validateFields();
    setGenerating(true);
    try {
      const schedule = await procurementRecordApi.previewSchedule(toRequest(values));
      setRows(schedule.map((row, key) => ({
        key, label: row.label || '', due_date: dayjs(row.due_date), amount: Number(row.amount),
      })));
    } catch {
      // API client shows the validation message
    } finally {
      setGenerating(false);
    }
  };

  const updateRow = (key: number, patch: Partial<EditableRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    if (!record) return;
    const values = await form.validateFields();
    if (rows.length === 0) {
      await generate();
      return;
    }
    setSaving(true);
    try {
      const saved = await procurementRecordApi.setTerms(record.id, {
        ...toRequest(values),
        installments: rows.map((row) => ({
          label: row.label,
          due_date: row.due_date.format('YYYY-MM-DD'),
          amount: row.amount.toFixed(2),
        })),
      });
      onSaved(saved);
    } catch {
      // API client shows the validation message
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={record ? `Payment terms · ${record.record_number}` : 'Payment terms'}
      open={record !== null}
      onCancel={onClose}
      onOk={handleSave}
      okText="Save Terms"
      okButtonProps={{ disabled: rows.length > 0 && !balanced }}
      confirmLoading={saving}
      width="min(900px, 100vw)"
      destroyOnHidden
    >
      {record && (
        <>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {record.vendor_name} · {record.procurement_number} · {record.item_description}
          </Text>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={() => setRows([])}
            initialValues={{
              total_amount: Number(record.total_amount),
              deposit_amount: Number(record.deposit_amount) || 0,
              installment_count: record.installment_count || 1,
              frequency: record.frequency || 'once',
              first_due_date: record.first_due_date ? dayjs(record.first_due_date) : undefined,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label={`Total (${currency})`} name="total_amount" rules={[{ required: true }, { type: 'number', min: 0.01 }]}>
                  <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label={`Deposit (${currency})`} name="deposit_amount" tooltip="Optional upfront payment, due on the first due date">
                  <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Form.Item label="Installments" name="installment_count" rules={[{ required: true }, { type: 'number', min: 1 }]}>
                  <InputNumber style={{ width: '100%' }} min={1} max={120} precision={0} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Form.Item label="Period" name="frequency" rules={[{ required: true }]}>
                  <Select options={PAYMENT_FREQUENCIES} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8} md={4}>
                <Form.Item label="First due" name="first_due_date" rules={[{ required: true, message: 'Pick a date' }]}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Button onClick={generate} loading={generating} style={{ marginBottom: 12 }}>
            {rows.length ? 'Regenerate schedule' : 'Generate schedule'}
          </Button>

          {rows.length > 0 && (
            <>
              <Table<EditableRow>
                size="small"
                rowKey="key"
                pagination={false}
                dataSource={rows}
                scroll={{ y: 300 }}
                columns={[
                  {
                    title: 'Installment', dataIndex: 'label', key: 'label',
                    render: (label: string, row) => (
                      <Input value={label} maxLength={50} onChange={(e) => updateRow(row.key, { label: e.target.value })} />
                    ),
                  },
                  {
                    title: 'Due date', dataIndex: 'due_date', key: 'due_date', width: 170,
                    render: (date: Dayjs, row) => (
                      <DatePicker
                        value={date}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        onChange={(value) => value && updateRow(row.key, { due_date: value })}
                      />
                    ),
                  },
                  {
                    title: `Amount (${currency})`, dataIndex: 'amount', key: 'amount', width: 170,
                    render: (amount: number, row) => (
                      <InputNumber
                        value={amount}
                        min={0.01}
                        precision={2}
                        style={{ width: '100%' }}
                        onChange={(value) => updateRow(row.key, { amount: Number(value) || 0 })}
                      />
                    ),
                  },
                ]}
              />
              <div style={{ marginTop: 12 }}>
                {balanced ? (
                  <Text type="success">Schedule adds up to {formatMoney(currency, total)}.</Text>
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    title={`Schedule adds up to ${formatMoney(currency, scheduled)}, but the total is ${formatMoney(currency, total)}.`}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
};
