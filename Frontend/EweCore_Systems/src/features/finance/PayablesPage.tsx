import { useEffect, useMemo, useState } from 'react';
import { Button, Space, Row, Col, Select, Tabs, Tag, Typography, message } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { usePayablesStore } from '../../store/payablesStore';
import {
  MEMBER_PAYABLE_CATEGORIES,
  PAYABLE_CURRENCIES,
  VENDOR_PAYABLE_CATEGORIES,
  type MarkPaidRequest,
  type PayableCreateRequest,
  type PayableListResponse,
} from '../../services/api/payables';
import { PayableFormModal } from './PayableFormModal';
import { PayableActionModal, type PayableAction } from './PayableActionModal';
import { PayableDetailsDrawer } from './PayableDetailsDrawer';
import {
  PRIORITY_COLORS,
  approvalProgress,
  canApproveOrReject,
  formatCurrencyTotals,
  formatDate,
  formatMoney,
} from './payableUtils';

const { Text } = Typography;

type TabKey = 'all' | 'my-action' | 'my-requests';

/** It is the current user's turn in this payable's workflow (approve, reject or pay). */
const needsMyAction = (p: PayableListResponse) => Boolean(p.approval?.can_act);

export const PayablesPage = () => {
  const { user } = useAuthStore();
  const {
    payables,
    vendors,
    loading,
    fetchPayables,
    fetchVendors,
    addVendor,
    submitPayable,
    approvePayable,
    rejectPayable,
    markAsPaid,
  } = usePayablesStore();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [payeeTypeFilter, setPayeeTypeFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ payable: PayableListResponse; action: PayableAction } | null>(null);

  useEffect(() => {
    fetchPayables();
    fetchVendors();
  }, [fetchPayables, fetchVendors]);

  // Read from the store so the drawer reflects updates after workflow actions
  const selectedPayable = payables.find((p) => p.id === selectedId) ?? null;

  const tabPayables = useMemo(() => {
    if (activeTab === 'my-action') return payables.filter(needsMyAction);
    if (activeTab === 'my-requests') return payables.filter((p) => p.submitted_by === user?.id);
    return payables;
  }, [activeTab, payables, user?.id]);

  const currencyPayables = useMemo(
    () => (currencyFilter === 'all' ? tabPayables : tabPayables.filter((p) => p.currency === currencyFilter)),
    [tabPayables, currencyFilter]
  );

  const filteredPayables = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return currencyPayables.filter((p) => {
      const matchesSearch = !search || [p.payable_number, p.payee_name, p.payee_reference, p.invoice_number, p.description]
        .some((field) => field?.toLowerCase().includes(search));
      return matchesSearch
        && (!payeeTypeFilter || p.payee_type === payeeTypeFilter)
        && (!categoryFilter || p.category === categoryFilter)
        && (!statusFilter || p.status === statusFilter)
        && (!priorityFilter || p.priority === priorityFilter);
    });
  }, [currencyPayables, searchTerm, payeeTypeFilter, categoryFilter, statusFilter, priorityFilter]);

  const fallbackCurrency = currencyFilter === 'all' ? 'ZWG' : currencyFilter;
  const stats = {
    outstanding: formatCurrencyTotals(
      currencyPayables.filter((p) => p.status === 'pending' || p.status === 'approved'),
      fallbackCurrency
    ),
    awaitingMe: payables.filter(needsMyAction).length,
    awaitingPayment: formatCurrencyTotals(currencyPayables.filter((p) => p.status === 'approved'), fallbackCurrency),
    overdue: currencyPayables.filter((p) => p.is_overdue).length,
  };

  const handleCreate = async (data: PayableCreateRequest) => {
    const created = await submitPayable(data);
    message.success(`Payable ${created.payable_number} submitted for approval`);
    setCreateOpen(false);
  };

  const handleApprove = async (payable: PayableListResponse, comments: string) => {
    await approvePayable(payable, comments);
    message.success(`${payable.payable_number} approved`);
  };

  const handleReject = async (payable: PayableListResponse, comments: string) => {
    await rejectPayable(payable, comments);
    message.success(`${payable.payable_number} rejected`);
  };

  const handlePay = async (payable: PayableListResponse, data: MarkPaidRequest) => {
    await markAsPaid(payable.id, data);
    message.success(`${payable.payable_number} marked as paid`);
  };

  const openAction = (payable: PayableListResponse, action: PayableAction) => setPendingAction({ payable, action });

  const columns: ColumnsType<PayableListResponse> = [
    {
      title: 'Payable',
      dataIndex: 'payable_number',
      key: 'payable_number',
      width: 150,
      fixed: 'left',
      render: (number: string, record) => (
        <>
          <Text strong>{number}</Text>
          <div><Text type="secondary" style={{ fontSize: 12 }}>{formatDate(record.created_at)}</Text></div>
        </>
      ),
    },
    {
      title: 'Payee',
      dataIndex: 'payee_name',
      key: 'payee_name',
      width: 230,
      render: (name: string, record) => (
        <>
          <Text strong>{name}</Text>
          <div>
            <Tag color={record.payee_type === 'member' ? 'green' : 'blue'} style={{ marginRight: 6 }}>
              {record.payee_type === 'member' ? 'Member' : 'Vendor'}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.payee_reference}</Text>
          </div>
        </>
      ),
    },
    {
      title: 'For',
      dataIndex: 'category_display',
      key: 'category_display',
      width: 170,
      render: (category: string, record) => (
        <>
          <div>{category}</div>
          {record.invoice_number && <Text type="secondary" style={{ fontSize: 12 }}>{record.invoice_number}</Text>}
        </>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 150,
      align: 'right',
      render: (amount: string, record) => <Text strong>{formatMoney(record.currency, amount)}</Text>,
      sorter: (a, b) => Number(a.total_amount) - Number(b.total_amount),
    },
    {
      title: 'Due',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (date: string, record) => (
        <Text type={record.is_overdue ? 'danger' : undefined}>
          {formatDate(date)}
          {record.is_overdue && <div style={{ fontSize: 12 }}>Overdue</div>}
        </Text>
      ),
      sorter: (a, b) => a.due_date.localeCompare(b.due_date),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 230,
      render: (status: string, record) => {
        const progress = approvalProgress(record);
        return (
          <>
            <StatusTag status={status} />
            {progress && <div><Text type="secondary" style={{ fontSize: 12 }}>{progress}</Text></div>}
          </>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: string) => <Tag color={PRIORITY_COLORS[priority]}>{priority.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 230,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedId(record.id)} aria-label={`View ${record.payable_number}`}>
            View
          </Button>
          {canApproveOrReject(record) && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openAction(record, 'approve')}>
                Approve
              </Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => openAction(record, 'reject')}>
                Reject
              </Button>
            </>
          )}
          {record.can_mark_paid && (
            <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => openAction(record, 'pay')}>
              Record Payment
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search payable, payee, invoice or description...',
      value: searchTerm,
      onChange: setSearchTerm,
      width: 320,
    },
    {
      type: 'select',
      label: 'Payee',
      placeholder: 'All Payees',
      value: payeeTypeFilter,
      onChange: (value: string | undefined) => {
        setPayeeTypeFilter(value);
        setCategoryFilter(undefined);
      },
      options: [
        { label: 'Vendors', value: 'vendor' },
        { label: 'Members', value: 'member' },
      ],
      width: 140,
    },
    {
      type: 'select',
      label: 'Category',
      placeholder: 'All Categories',
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: payeeTypeFilter === 'member'
        ? MEMBER_PAYABLE_CATEGORIES
        : payeeTypeFilter === 'vendor'
          ? VENDOR_PAYABLE_CATEGORIES
          : [...MEMBER_PAYABLE_CATEGORIES, ...VENDOR_PAYABLE_CATEGORIES],
      width: 190,
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Pending Approval', value: 'pending' },
        { label: 'Awaiting Payment', value: 'approved' },
        { label: 'Paid', value: 'paid' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      width: 170,
    },
    {
      type: 'select',
      label: 'Priority',
      placeholder: 'All Priorities',
      value: priorityFilter,
      onChange: setPriorityFilter,
      options: [
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
      width: 130,
    },
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setCurrencyFilter('all');
    setPayeeTypeFilter(undefined);
    setCategoryFilter(undefined);
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
  };

  return (
    <div>
      <PageHeader
        title="Payables"
        subtitle="Payments to vendors and SACCO members, approved and paid through the payables workflow"
        breadcrumbs={[{ title: 'Finance' }, { title: 'Payables' }]}
        actions={
          <Space wrap>
            <Select
              value={currencyFilter}
              onChange={setCurrencyFilter}
              style={{ width: 160 }}
              size="large"
              aria-label="Filter by currency"
              options={[
                { value: 'all', label: 'All Currencies' },
                ...PAYABLE_CURRENCIES.map((c) => ({ value: c, label: `${c} Only` })),
              ]}
            />
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              New Payable
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Outstanding" value={stats.outstanding} icon={<WalletOutlined />} iconBg="rgba(6, 147, 227, 0.1)" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Awaiting My Action" value={stats.awaitingMe} icon={<ClockCircleOutlined />} iconBg="rgba(255, 105, 0, 0.1)" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Awaiting Payment" value={stats.awaitingPayment} icon={<DollarOutlined />} iconBg="rgba(0, 208, 132, 0.1)" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Overdue" value={stats.overdue} icon={<WarningOutlined />} iconBg="rgba(207, 46, 46, 0.1)" />
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={[
          { key: 'all', label: 'All Payables' },
          { key: 'my-action', label: `Awaiting My Action (${stats.awaitingMe})` },
          { key: 'my-requests', label: 'My Requests' },
        ]}
      />

      <FilterBar filters={filters} onReset={handleResetFilters} />

      <DataTable
        columns={columns}
        dataSource={filteredPayables}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        locale={{ emptyText: activeTab === 'my-action' ? 'Nothing is waiting for you' : 'No payables found' }}
      />

      <PayableFormModal
        open={createOpen}
        vendors={vendors}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        onAddVendor={addVendor}
      />

      <PayableDetailsDrawer
        key={selectedPayable?.id ?? 'none'}
        payable={selectedPayable}
        onClose={() => setSelectedId(null)}
        onAction={openAction}
      />

      <PayableActionModal
        key={pendingAction ? `${pendingAction.payable.id}-${pendingAction.action}` : 'none'}
        payable={pendingAction?.payable ?? null}
        action={pendingAction?.action ?? 'approve'}
        onClose={() => setPendingAction(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onPay={handlePay}
      />
    </div>
  );
};
