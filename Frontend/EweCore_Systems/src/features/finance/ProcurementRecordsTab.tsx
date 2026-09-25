import { useEffect, useState } from 'react';
import { Drawer, Descriptions, Table, Tag, Typography, Button, Alert, Spin, Space, Empty, message } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DataTable } from '../../components/common';
import {
  procurementRecordApi,
  type ProcurementInstallment,
  type ProcurementPaymentEntry,
  type ProcurementRecord,
  type ProcurementRecordStatus,
} from '../../services/api/procurement';
import { PaymentTermsModal } from './PaymentTermsModal';
import { formatDate, formatMoney } from './payableUtils';

const { Text, Title } = Typography;

const STATUS_COLORS: Record<ProcurementRecordStatus, string> = {
  awaiting_terms: 'orange',
  active: 'blue',
  completed: 'green',
  cancelled: 'default',
};

const INSTALLMENT_COLORS: Record<ProcurementInstallment['status'], string> = {
  pending: 'default',
  partially_paid: 'orange',
  paid: 'green',
};

interface ProcurementRecordsTabProps {
  /** Record to open on load (e.g. from a notification link) */
  initialRecordId?: string | null;
  onRecordClosed?: () => void;
}

/** Procurement records: what is owed to awarded suppliers, their installment schedules and payments. */
export const ProcurementRecordsTab = ({ initialRecordId, onRecordClosed }: ProcurementRecordsTabProps) => {
  const [records, setRecords] = useState<ProcurementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRecordId, setOpenRecordId] = useState<string | null>(initialRecordId ?? null);
  const [detail, setDetail] = useState<ProcurementRecord | null>(null);
  const [termsRecord, setTermsRecord] = useState<ProcurementRecord | null>(null);

  // Incremented to reload the list (e.g. after terms are saved)
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    procurementRecordApi.list()
      .then((response) => { if (!cancelled) setRecords(response.results); })
      .catch(() => { /* API client shows the error */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    if (!openRecordId) return;
    let cancelled = false;
    procurementRecordApi.retrieve(openRecordId)
      .then((record) => { if (!cancelled) setDetail(record); })
      .catch(() => { if (!cancelled) setOpenRecordId(null); });
    return () => { cancelled = true; };
  }, [openRecordId]);

  const closeDrawer = () => {
    setOpenRecordId(null);
    setDetail(null);
    onRecordClosed?.();
  };

  const handleTermsSaved = (saved: ProcurementRecord) => {
    setTermsRecord(null);
    setDetail(saved);
    message.success(`Payment terms saved for ${saved.record_number}`);
    setReloadKey((key) => key + 1);
  };

  const columns: ColumnsType<ProcurementRecord> = [
    {
      title: 'Record', dataIndex: 'record_number', key: 'record_number', width: 170,
      render: (number: string, record) => (
        <>
          <Text strong>{number}</Text>
          <div><Text type="secondary" style={{ fontSize: 12 }}>{record.procurement_number}</Text></div>
        </>
      ),
    },
    {
      title: 'Supplier / Item', key: 'vendor', width: 260,
      render: (_, record) => (
        <>
          <Text strong>{record.vendor_name}</Text>
          <div><Text type="secondary" style={{ fontSize: 12 }} ellipsis>{record.item_description}</Text></div>
        </>
      ),
    },
    { title: 'Total', key: 'total', width: 140, align: 'right', render: (_, r) => formatMoney(r.currency, r.total_amount) },
    { title: 'Paid', key: 'paid', width: 140, align: 'right', render: (_, r) => formatMoney(r.currency, r.amount_paid) },
    {
      title: 'Balance', key: 'balance', width: 140, align: 'right',
      render: (_, r) => <Text strong>{formatMoney(r.currency, r.balance)}</Text>,
    },
    {
      title: 'Next Due', key: 'next_due', width: 190,
      render: (_, r) => r.next_due
        ? <>{formatDate(r.next_due.due_date)} <Text type="secondary">· {r.next_due.label}</Text></>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 170,
      render: (status: ProcurementRecordStatus, r) => <Tag color={STATUS_COLORS[status]}>{r.status_display}</Tag>,
    },
    {
      title: '', key: 'actions', width: 170, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => { setDetail(null); setOpenRecordId(r.id); }}>View</Button>
          {r.status === 'awaiting_terms' && r.can_edit_terms && (
            <Button size="small" type="primary" icon={<CalendarOutlined />} onClick={() => setTermsRecord(r)}>
              Set Terms
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderDetail = () => {
    if (!detail) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;
    const currency = detail.currency;
    return (
      <>
        {detail.status === 'awaiting_terms' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            title="Payment terms have not been set yet, so nothing can be paid on this record."
            action={detail.can_edit_terms && (
              <Button size="small" type="primary" onClick={() => setTermsRecord(detail)}>Set Terms</Button>
            )}
          />
        )}
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Supplier">{detail.vendor_name} ({detail.vendor_code})</Descriptions.Item>
          <Descriptions.Item label="Procurement">{detail.procurement_number}</Descriptions.Item>
          <Descriptions.Item label="Item" span={{ xs: 1, sm: 2 }}>{detail.item_description}</Descriptions.Item>
          <Descriptions.Item label="Requested By">{detail.requested_by_name}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[detail.status]}>{detail.status_display}</Tag></Descriptions.Item>
          <Descriptions.Item label="Total">{formatMoney(currency, detail.total_amount)}</Descriptions.Item>
          <Descriptions.Item label="Paid">{formatMoney(currency, detail.amount_paid)}</Descriptions.Item>
          <Descriptions.Item label="Balance"><Text strong>{formatMoney(currency, detail.balance)}</Text></Descriptions.Item>
          <Descriptions.Item label="Terms">
            {detail.status === 'awaiting_terms'
              ? '—'
              : `${Number(detail.deposit_amount) > 0 ? `${formatMoney(currency, detail.deposit_amount)} deposit + ` : ''}${detail.installment_count} × ${detail.frequency_display}`}
          </Descriptions.Item>
          {detail.terms_set_by_name && (
            <Descriptions.Item label="Terms Set By" span={{ xs: 1, sm: 2 }}>
              {detail.terms_set_by_name} on {formatDate(detail.terms_set_at, true)}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>Installments</Title>
          {detail.status !== 'awaiting_terms' && detail.can_edit_terms && !detail.terms_locked_reason && (
            <Button size="small" onClick={() => setTermsRecord(detail)}>Edit Terms</Button>
          )}
        </Space>
        {detail.terms_locked_reason && detail.status !== 'completed' && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{detail.terms_locked_reason}</Text>
        )}
        <Table<ProcurementInstallment>
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={detail.installments}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No schedule yet" /> }}
          style={{ marginBottom: 24 }}
          columns={[
            { title: 'Installment', dataIndex: 'label', key: 'label' },
            { title: 'Due', dataIndex: 'due_date', key: 'due_date', render: (d: string) => formatDate(d) },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (a: string) => formatMoney(currency, a) },
            { title: 'Paid', dataIndex: 'amount_paid', key: 'amount_paid', align: 'right', render: (a: string) => formatMoney(currency, a) },
            {
              title: 'Status', key: 'status',
              render: (_, inst) => (
                <>
                  <Tag color={INSTALLMENT_COLORS[inst.status]}>{inst.status.replace('_', ' ')}</Tag>
                  {inst.reserved_by && <Text type="secondary" style={{ fontSize: 12 }}>in {inst.reserved_by.payable_number}</Text>}
                </>
              ),
            },
          ]}
        />

        <Title level={5}>Payment History</Title>
        <Table<ProcurementPaymentEntry>
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={detail.payments ?? []}
          locale={{ emptyText: 'No payments yet' }}
          columns={[
            { title: 'Date', dataIndex: 'paid_date', key: 'paid_date', render: (d: string) => formatDate(d) },
            { title: 'Installment', dataIndex: 'installment_label', key: 'installment_label' },
            { title: 'Payable', dataIndex: 'payable_number', key: 'payable_number' },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (a: string) => formatMoney(currency, a) },
            { title: 'Recorded By', dataIndex: 'recorded_by_name', key: 'recorded_by_name' },
          ]}
        />
      </>
    );
  };

  return (
    <>
      <DataTable
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1300 }}
        locale={{ emptyText: 'No procurement records yet. They are created when a procurement request gets final approval.' }}
      />

      <Drawer
        title={detail ? `${detail.record_number} · ${detail.vendor_name}` : 'Procurement Record'}
        placement="right"
        size="min(820px, 100vw)"
        open={openRecordId !== null}
        onClose={closeDrawer}
        destroyOnHidden
      >
        {renderDetail()}
      </Drawer>

      <PaymentTermsModal
        key={termsRecord?.id ?? 'none'}
        record={termsRecord}
        onClose={() => setTermsRecord(null)}
        onSaved={handleTermsSaved}
      />
    </>
  );
};
