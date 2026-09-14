import { useState } from 'react';
import { Button, Avatar, Space, Row, Col } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  FilePdfOutlined,
  SendOutlined,
  DollarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { mockInvoices, invoiceStats } from '../../mock/invoices';
import type { Invoice } from '../../mock/invoices';

export const InvoicesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [amountRange, setAmountRange] = useState<[number, number] | undefined>(undefined);

  // Filter invoices
  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || invoice.status === statusFilter;

    // Date range filter
    let matchesDate = true;
    if (dateRange && dateRange.length === 2) {
      const invoiceDate = new Date(invoice.createdDate);
      const startDate = dateRange[0]?.toDate();
      const endDate = dateRange[1]?.toDate();
      matchesDate = invoiceDate >= startDate && invoiceDate <= endDate;
    }

    // Amount range filter
    let matchesAmount = true;
    if (amountRange) {
      matchesAmount = invoice.amount >= amountRange[0] && invoice.amount <= amountRange[1];
    }

    return matchesSearch && matchesStatus && matchesDate && matchesAmount;
  });

  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by client, company, or invoice ID...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 300,
    },
    {
      type: 'dateRange',
      label: 'Date Range',
      onChange: setDateRange,
      value: dateRange,
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'Select Status',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 150,
      options: [
        { label: 'Paid', value: 'Paid' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Overdue', value: 'Overdue' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Sent', value: 'Sent' },
        { label: 'Partially Paid', value: 'Partially Paid' },
      ],
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setDateRange(undefined);
    setAmountRange(undefined);
  };

  // Table columns matching the Invoices.png design
  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice ID',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (id: string) => (
        <span style={{ fontWeight: 600, color: '#0693e3', cursor: 'pointer' }}>
          {id}
        </span>
      ),
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 200,
      render: (name: string, record: Invoice) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar
            size={36}
            style={{
              background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
              color: 'white',
              fontWeight: 600,
            }}
          >
            {name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, color: '#32373c' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.clientRole}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 180,
      render: (company: string) => (
        <span style={{ color: '#595959' }}>{company}</span>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 120,
      render: (date: string) => (
        <span style={{ color: '#595959' }}>
          {new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => (
        <span style={{ color: '#595959' }}>
          {new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#32373c', fontSize: '13px' }}>
          ${amount.toLocaleString()}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusTag status={status} />,
      filters: [
        { text: 'Paid', value: 'Paid' },
        { text: 'Pending', value: 'Pending' },
        { text: 'Overdue', value: 'Overdue' },
        { text: 'Draft', value: 'Draft' },
        { text: 'Sent', value: 'Sent' },
        { text: 'Partially Paid', value: 'Partially Paid' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record: Invoice) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            style={{ color: '#0693e3' }}
            title="View"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            style={{ color: '#00d084' }}
            title="Edit"
          />
          <Button
            type="text"
            size="small"
            icon={<FilePdfOutlined />}
            style={{ color: '#cf2e2e' }}
            title="Download PDF"
          />
          {(record.status === 'Draft' || record.status === 'Pending') && (
            <Button
              type="text"
              size="small"
              icon={<SendOutlined />}
              style={{ color: '#9b51e0' }}
              title="Send"
            />
          )}
        </Space>
      ),
    },
  ];

  // Calculate summary stats
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = filteredInvoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = filteredInvoices
    .filter((inv) => inv.status === 'Pending' || inv.status === 'Sent')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = filteredInvoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all client invoices"
        breadcrumbs={[
          { title: 'HR' },
          { title: 'Invoices' },
        ]}
        actions={
          <>
            <Button
              icon={<DownloadOutlined />}
              style={{ borderRadius: '8px' }}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
              }}
            >
              Add New Invoice
            </Button>
          </>
        }
      />

      {/* Summary Statistics */}
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Invoices"
              value={filteredInvoices.length}
              icon={<FileTextOutlined />}
              iconBg="rgba(6, 147, 227, 0.1)"
              change={12.5}
              trend="up"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Amount"
              value={totalAmount}
              prefix="$"
              icon={<DollarOutlined />}
              cardBg="linear-gradient(135deg, #00d084 0%, #00BFA5 100%)"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Paid"
              value={paidAmount}
              prefix="$"
              icon={<CheckCircleOutlined />}
              iconBg="rgba(0, 208, 132, 0.1)"
              change={8.3}
              trend="up"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Pending"
              value={pendingAmount}
              prefix="$"
              icon={<ClockCircleOutlined />}
              iconBg="rgba(255, 105, 0, 0.1)"
              change={3.2}
              trend="down"
            />
          </Col>
        </Row>
      </div>

      <FilterBar
        filters={filters}
        onSearch={setSearchTerm}
        onReset={handleReset}
      />

      <DataTable
        columns={columns}
        dataSource={filteredInvoices}
        rowKey="id"
        scroll={{ x: 1400 }}
      />
    </div>
  );
};
