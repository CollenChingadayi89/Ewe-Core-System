import { useState, useEffect } from 'react';
import { Button, Avatar, Space, Row, Col, Modal, Form, Input, Select, DatePicker, InputNumber, message, Drawer, Descriptions, Timeline, Typography, Upload, Tabs, Tag } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  UploadOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  MoneyCollectOutlined,
  BankOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useReceivablesStore } from '../../store/receivablesStore';
import type { Receivable, ReceivableCategory } from '../../types/index';
import { categoryDisplayNames } from '../../mock/receivables';

const { TextArea } = Input;
const { Text, Title } = Typography;

export const ReceivablesPage = () => {
  const { user } = useAuthStore();
  const {
    receivables,
    customers,
    loading,
    fetchReceivables,
    submitReceivable,
    approveReceivable,
    rejectReceivable,
    markAsPaid,
    recordPayment,
  } = useReceivablesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'paid'>('approve');
  const [form] = Form.useForm();
  const [actionForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  // Get my receivables (created by me)
  const myReceivables = receivables.filter(r => r.createdBy === user?.id);

  // Determine which dataset to show
  const displayReceivables = activeTab === 'all' ? receivables : myReceivables;

  // Calculate statistics
  const stats = {
    total: displayReceivables.reduce((sum, r) => sum + (r.amountOutstanding || r.amount), 0),
    pending: displayReceivables.filter(r => r.status === 'pending').length,
    dueThisWeek: displayReceivables.filter(r => {
      const dueDate = dayjs(r.expectedDate, 'DD/MM/YYYY');
      const today = dayjs();
      const weekFromNow = today.add(7, 'day');
      return dueDate.isAfter(today) && dueDate.isBefore(weekFromNow) && (r.status === 'approved' || r.status === 'scheduled');
    }).length,
    overdue: displayReceivables.filter(r => r.status === 'overdue' || r.status === 'defaulted').length,
  };

  // Filter receivables
  const filteredReceivables = displayReceivables.filter((receivable) => {
    const matchesSearch = !searchTerm ||
      receivable.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receivable.memberNumber && receivable.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !statusFilter || receivable.status === statusFilter;
    const matchesCategory = !categoryFilter || receivable.category === categoryFilter;
    const matchesDepartment = !departmentFilter || receivable.department === departmentFilter;
    const matchesPriority = !priorityFilter || receivable.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesPriority;
  });

  const handleSubmitReceivable = async (values: any) => {
    try {
      const selectedCustomer = customers.find(c => c.id === values.memberId);

      await submitReceivable(user!.id, user!.name, {
        memberId: values.memberId,
        memberName: selectedCustomer?.name || values.memberName,
        memberNumber: selectedCustomer?.memberNumber || values.memberNumber,
        phone: selectedCustomer?.phone || values.phone,
        email: selectedCustomer?.email || values.email,
        category: values.category,
        categoryDisplay: categoryDisplayNames[values.category as ReceivableCategory],
        referenceNumber: values.referenceNumber,
        invoiceDate: values.invoiceDate.format('DD/MM/YYYY'),
        amount: values.amount,
        currency: 'ZWG',
        dueDate: values.dueDate.format('DD/MM/YYYY'),
        expectedDate: values.expectedDate.format('DD/MM/YYYY'),
        department: values.department,
        description: values.description,
        paymentMethod: values.paymentMethod,
        priority: values.priority,
        installmentNumber: values.installmentNumber,
        totalInstallments: values.totalInstallments,
        loanAccountNumber: values.loanAccountNumber,
        shareCertificateNumber: values.shareCertificateNumber,
        notes: values.notes,
        attachments: values.attachments?.fileList?.map((file: any) => file.name) || [],
      });

      message.success('Receivable request submitted successfully!');
      setRequestModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit receivable request');
    }
  };

  const handleViewDetails = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setDetailsDrawerVisible(true);
  };

  const handleOpenActionModal = (receivable: Receivable, type: 'approve' | 'reject' | 'paid') => {
    setSelectedReceivable(receivable);
    setActionType(type);
    setActionModalVisible(true);
  };

  const handleOpenPaymentModal = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setPaymentModalVisible(true);
    paymentForm.setFieldsValue({
      maxAmount: receivable.amountOutstanding || receivable.amount,
    });
  };

  const handleSubmitAction = async (values: any) => {
    if (!selectedReceivable || !user) return;

    try {
      if (actionType === 'approve') {
        await approveReceivable(selectedReceivable.id, user.id, user.name, values.comment);
        message.success('Receivable approved successfully!');
      } else if (actionType === 'reject') {
        await rejectReceivable(selectedReceivable.id, user.id, user.name, values.comment);
        message.success('Receivable rejected successfully!');
      } else if (actionType === 'paid') {
        await markAsPaid(selectedReceivable.id, user.id, user.name);
        message.success('Receivable marked as paid successfully!');
      }

      setActionModalVisible(false);
      setDetailsDrawerVisible(false);
      actionForm.resetFields();
    } catch (error) {
      message.error('Failed to process action');
    }
  };

  const handleRecordPayment = async (values: any) => {
    if (!selectedReceivable || !user) return;

    try {
      await recordPayment(selectedReceivable.id, user.id, user.name, {
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate.format('DD/MM/YYYY'),
        reference: values.reference,
        notes: values.notes,
      });

      message.success('Payment recorded successfully!');
      setPaymentModalVisible(false);
      setDetailsDrawerVisible(false);
      paymentForm.resetFields();
    } catch (error) {
      message.error('Failed to record payment');
    }
  };

  const handleExport = () => {
    message.info('Exporting receivables to Excel...');
  };

  // Table columns
  const columns: ColumnsType<Receivable> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      fixed: 'left',
      render: (id: string) => <Text strong>{id}</Text>,
    },
    {
      title: 'Member',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 220,
      render: (name: string, record: Receivable) => (
        <Space>
          <Avatar style={{ backgroundColor: '#00d084' }}>
            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Avatar>
          <div>
            <div><Text strong>{name}</Text></div>
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.memberNumber}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Service/Category',
      dataIndex: 'categoryDisplay',
      key: 'categoryDisplay',
      width: 200,
      render: (category: string, record: Receivable) => {
        const colors: { [key: string]: string } = {
          'ewe-cub': 'purple',
          'loan-0-percent': 'blue',
          'loan-10-percent': 'cyan',
          'mukando': 'geekblue',
          'student-sacco': 'magenta',
          'share-purchase': 'gold',
        };
        return <Tag color={colors[record.category] || 'default'}>{category}</Tag>;
      },
    },
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      width: 150,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount: number) => (
        <Text strong style={{ color: '#00d084' }}>
          ZWG {amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Outstanding',
      dataIndex: 'amountOutstanding',
      key: 'amountOutstanding',
      width: 130,
      render: (outstanding: number | undefined, record: Receivable) => {
        const amount = outstanding ?? record.amount;
        return (
          <Text strong style={{ color: amount > 0 ? '#ff6900' : '#00d084' }}>
            ZWG {amount.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: 'Expected Date',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 130,
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{date}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colors: { [key: string]: string } = {
          high: 'red',
          medium: 'orange',
          low: 'blue',
        };
        return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 320,
      render: (_: any, record: Receivable) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleOpenActionModal(record, 'approve')}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleOpenActionModal(record, 'reject')}
              >
                Reject
              </Button>
            </>
          )}
          {(record.status === 'approved' || record.status === 'partially-paid') && (
            <>
              {record.status === 'approved' && (
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleOpenActionModal(record, 'paid')}
                  style={{ background: '#52c41a' }}
                >
                  Mark Paid
                </Button>
              )}
              <Button
                size="small"
                icon={<MoneyCollectOutlined />}
                onClick={() => handleOpenPaymentModal(record)}
              >
                Record Payment
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Filters configuration
  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by member, reference, or description...',
      value: searchTerm,
      onChange: setSearchTerm,
      width: 350,
    },
    {
      type: 'select',
      label: 'Service Type',
      placeholder: 'All Services',
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: [
        { label: 'Ewe Cub', value: 'ewe-cub' },
        { label: '0% Loan', value: 'loan-0-percent' },
        { label: '10% Loan', value: 'loan-10-percent' },
        { label: 'Mukando', value: 'mukando' },
        { label: 'Student SACCO', value: 'student-sacco' },
        { label: 'Share Purchase', value: 'share-purchase' },
        { label: 'Registration Fees', value: 'registration' },
        { label: 'Membership Fee', value: 'membership-fee' },
        { label: 'Service Charge', value: 'service-charge' },
      ],
      width: 170,
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Partially Paid', value: 'partially-paid' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Defaulted', value: 'defaulted' },
        { label: 'Rejected', value: 'rejected' },
      ],
      width: 150,
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
    setStatusFilter(undefined);
    setCategoryFilter(undefined);
    setDepartmentFilter(undefined);
    setPriorityFilter(undefined);
  };

  // Get category-specific fields visibility
  const selectedCategory = Form.useWatch('category', form);
  const showLoanFields = selectedCategory === 'loan-0-percent' || selectedCategory === 'loan-10-percent';
  const showShareFields = selectedCategory === 'share-purchase';

  return (
    <div>
      <PageHeader
        title="Receivables Management"
        subtitle="Track and manage incoming payments from SACCO members"
        breadcrumbs={[
          { title: 'Finance' },
          { title: 'Receivables' },
        ]}
        actions={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setRequestModalVisible(true)}
              style={{
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              New Receivable Request
            </Button>
          </Space>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Receivables"
            value={`ZWG ${stats.total.toLocaleString()}`}
            icon={<MoneyCollectOutlined />}
            iconBg="#00d084"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            icon={<ClockCircleOutlined />}
            iconBg="#ff6900"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Due This Week"
            value={stats.dueThisWeek}
            icon={<CalendarOutlined />}
            iconBg="#0693e3"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={<FileProtectOutlined />}
            iconBg="#cf2e2e"
          />
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: '16px' }}
        items={[
          {
            key: 'all',
            label: 'All Receivables',
          },
          {
            key: 'my-receivables',
            label: 'My Requests',
          },
        ]}
      />

      {/* Filters */}
      <FilterBar
        filters={filters}
        onReset={handleResetFilters}
        style={{ marginBottom: '16px' }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        dataSource={filteredReceivables}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1600 }}
      />

      {/* Request Modal */}
      <Modal
        title="New Receivable Request"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitReceivable}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Select Member"
                name="memberId"
                rules={[{ required: true, message: 'Please select a member' }]}
              >
                <Select
                  placeholder="Select SACCO member"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {customers.map(customer => (
                    <Select.Option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.memberNumber})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Service Type"
                name="category"
                rules={[{ required: true, message: 'Please select a service type' }]}
              >
                <Select placeholder="Select service" size="large">
                  <Select.OptGroup label="Loan Services">
                    <Select.Option value="loan-0-percent">0% Loan Repayment (Emergency)</Select.Option>
                    <Select.Option value="loan-10-percent">10% Loan Repayment (Standard)</Select.Option>
                  </Select.OptGroup>
                  <Select.OptGroup label="Savings & Investment">
                    <Select.Option value="ewe-cub">Ewe Cub (Children's Savings)</Select.Option>
                    <Select.Option value="mukando">Mukando (Group Savings)</Select.Option>
                    <Select.Option value="student-sacco">Student SACCO</Select.Option>
                    <Select.Option value="share-purchase">Share Purchase</Select.Option>
                  </Select.OptGroup>
                  <Select.OptGroup label="Fees">
                    <Select.Option value="registration-ewe-cub">Registration - Ewe Cub</Select.Option>
                    <Select.Option value="registration-loan-0">Registration - 0% Loan</Select.Option>
                    <Select.Option value="registration-loan-10">Registration - 10% Loan</Select.Option>
                    <Select.Option value="registration-mukando">Registration - Mukando</Select.Option>
                    <Select.Option value="registration-student">Registration - Student SACCO</Select.Option>
                    <Select.Option value="membership-fee">Membership Fee</Select.Option>
                    <Select.Option value="service-charge">Service Charge</Select.Option>
                  </Select.OptGroup>
                  <Select.OptGroup label="Other">
                    <Select.Option value="dividend-collection">Dividend Collection</Select.Option>
                    <Select.Option value="other">Other Income</Select.Option>
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Reference Number"
                name="referenceNumber"
                rules={[{ required: true, message: 'Please enter reference number' }]}
              >
                <Input placeholder="e.g., LN10-2026-001" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Amount (ZWG)"
                name="amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          {showLoanFields && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Loan Account Number" name="loanAccountNumber">
                  <Input placeholder="LN10-2024-XXX" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Installment Number" name="installmentNumber">
                  <InputNumber placeholder="1" size="large" style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Total Installments" name="totalInstallments">
                  <InputNumber placeholder="12" size="large" style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {showShareFields && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Share Certificate Number" name="shareCertificateNumber">
                  <Input placeholder="WES-CERT-2026-XXX" size="large" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Invoice Date"
                name="invoiceDate"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Due Date"
                name="dueDate"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Expected Payment Date"
                name="expectedDate"
                rules={[{ required: true, message: 'Please select expected date' }]}
              >
                <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="department"
                rules={[{ required: true, message: 'Please select department' }]}
                initialValue="Finance"
              >
                <Select size="large">
                  <Select.Option value="Finance">Finance</Select.Option>
                  <Select.Option value="Operations">Operations</Select.Option>
                  <Select.Option value="HR">HR</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Payment Method"
                name="paymentMethod"
              >
                <Select placeholder="Select payment method" size="large">
                  <Select.Option value="Mobile Money">Mobile Money</Select.Option>
                  <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
                  <Select.Option value="Cash">Cash</Select.Option>
                  <Select.Option value="Cheque">Cheque</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: 'Please enter description' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Enter detailed description of the receivable..."
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true, message: 'Please select priority' }]}
                initialValue="medium"
              >
                <Select size="large">
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Attachments" name="attachments">
                <Upload beforeUpload={() => false}>
                  <Button icon={<UploadOutlined />} size="large">
                    Upload Files
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Notes" name="notes">
                <TextArea
                  rows={2}
                  placeholder="Additional notes (optional)..."
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => { setRequestModalVisible(false); form.resetFields(); }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  border: 'none',
                }}
              >
                Submit Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Drawer */}
      <Drawer
        title="Receivable Details"
        placement="right"
        width={600}
        open={detailsDrawerVisible}
        onClose={() => setDetailsDrawerVisible(false)}
      >
        {selectedReceivable && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">{selectedReceivable.id}</Descriptions.Item>
              <Descriptions.Item label="Member">
                <Space>
                  <UserOutlined />
                  {selectedReceivable.memberName}
                  <Text type="secondary">({selectedReceivable.memberNumber})</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Service Type">
                <Tag>{selectedReceivable.categoryDisplay}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Reference">{selectedReceivable.referenceNumber}</Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong style={{ color: '#00d084' }}>
                  ZWG {selectedReceivable.amount.toLocaleString()}
                </Text>
              </Descriptions.Item>
              {selectedReceivable.amountPaid !== undefined && selectedReceivable.amountPaid > 0 && (
                <>
                  <Descriptions.Item label="Amount Paid">
                    <Text strong style={{ color: '#52c41a' }}>
                      ZWG {selectedReceivable.amountPaid.toLocaleString()}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Outstanding">
                    <Text strong style={{ color: '#ff6900' }}>
                      ZWG {(selectedReceivable.amountOutstanding || 0).toLocaleString()}
                    </Text>
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Status">
                <StatusTag status={selectedReceivable.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={selectedReceivable.priority === 'high' ? 'red' : selectedReceivable.priority === 'medium' ? 'orange' : 'blue'}>
                  {selectedReceivable.priority.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Date">{selectedReceivable.invoiceDate}</Descriptions.Item>
              <Descriptions.Item label="Due Date">{selectedReceivable.dueDate}</Descriptions.Item>
              <Descriptions.Item label="Expected Date">{selectedReceivable.expectedDate}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedReceivable.department}</Descriptions.Item>
              {selectedReceivable.phone && (
                <Descriptions.Item label="Phone">
                  <Space><PhoneOutlined />{selectedReceivable.phone}</Space>
                </Descriptions.Item>
              )}
              {selectedReceivable.email && (
                <Descriptions.Item label="Email">
                  <Space><MailOutlined />{selectedReceivable.email}</Space>
                </Descriptions.Item>
              )}
              {selectedReceivable.loanAccountNumber && (
                <Descriptions.Item label="Loan Account">{selectedReceivable.loanAccountNumber}</Descriptions.Item>
              )}
              {selectedReceivable.installmentNumber && selectedReceivable.totalInstallments && (
                <Descriptions.Item label="Installment">
                  {selectedReceivable.installmentNumber} of {selectedReceivable.totalInstallments}
                </Descriptions.Item>
              )}
              {selectedReceivable.shareCertificateNumber && (
                <Descriptions.Item label="Share Certificate">{selectedReceivable.shareCertificateNumber}</Descriptions.Item>
              )}
              <Descriptions.Item label="Description">{selectedReceivable.description}</Descriptions.Item>
              {selectedReceivable.paymentMethod && (
                <Descriptions.Item label="Payment Method">{selectedReceivable.paymentMethod}</Descriptions.Item>
              )}
              {selectedReceivable.notes && (
                <Descriptions.Item label="Notes">{selectedReceivable.notes}</Descriptions.Item>
              )}
            </Descriptions>

            <Title level={5} style={{ marginTop: '24px', marginBottom: '16px' }}>Timeline</Title>
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <>
                      <Text strong>Created</Text>
                      <br />
                      <Text type="secondary">{selectedReceivable.createdAt}</Text>
                      <br />
                      <Text>By: {selectedReceivable.createdByName}</Text>
                    </>
                  ),
                },
                ...(selectedReceivable.approvedAt ? [{
                  color: 'green',
                  children: (
                    <>
                      <Text strong>Approved</Text>
                      <br />
                      <Text type="secondary">{selectedReceivable.approvedAt}</Text>
                      <br />
                      <Text>By: {selectedReceivable.approvedBy}</Text>
                    </>
                  ),
                }] : []),
                ...(selectedReceivable.lastPaymentDate ? [{
                  color: 'purple',
                  children: (
                    <>
                      <Text strong>Payment Recorded</Text>
                      <br />
                      <Text type="secondary">{selectedReceivable.lastPaymentDate}</Text>
                      <br />
                      <Text>Amount: ZWG {(selectedReceivable.amountPaid || 0).toLocaleString()}</Text>
                    </>
                  ),
                }] : []),
                ...(selectedReceivable.paidAt ? [{
                  color: 'green',
                  children: (
                    <>
                      <Text strong>Fully Paid</Text>
                      <br />
                      <Text type="secondary">{selectedReceivable.paidAt}</Text>
                      <br />
                      <Text>By: {selectedReceivable.paidBy}</Text>
                    </>
                  ),
                }] : []),
              ]}
            />

            <Space style={{ marginTop: '24px', width: '100%', justifyContent: 'flex-end' }}>
              {selectedReceivable.status === 'pending' && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => {
                      setDetailsDrawerVisible(false);
                      handleOpenActionModal(selectedReceivable, 'approve');
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setDetailsDrawerVisible(false);
                      handleOpenActionModal(selectedReceivable, 'reject');
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {(selectedReceivable.status === 'approved' || selectedReceivable.status === 'partially-paid') && (
                <>
                  {selectedReceivable.status === 'approved' && (
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => {
                        setDetailsDrawerVisible(false);
                        handleOpenActionModal(selectedReceivable, 'paid');
                      }}
                      style={{ background: '#52c41a' }}
                    >
                      Mark as Paid
                    </Button>
                  )}
                  <Button
                    icon={<MoneyCollectOutlined />}
                    onClick={() => {
                      setDetailsDrawerVisible(false);
                      handleOpenPaymentModal(selectedReceivable);
                    }}
                  >
                    Record Payment
                  </Button>
                </>
              )}
            </Space>
          </div>
        )}
      </Drawer>

      {/* Action Modal (Approve/Reject/Mark Paid) */}
      <Modal
        title={
          actionType === 'approve' ? 'Approve Receivable' :
          actionType === 'reject' ? 'Reject Receivable' :
          'Mark as Paid'
        }
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          actionForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={actionForm}
          layout="vertical"
          onFinish={handleSubmitAction}
        >
          {selectedReceivable && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
              <Text strong>{selectedReceivable.memberName}</Text>
              <br />
              <Text type="secondary">{selectedReceivable.categoryDisplay}</Text>
              <br />
              <Text strong style={{ color: '#00d084' }}>
                ZWG {selectedReceivable.amount.toLocaleString()}
              </Text>
            </div>
          )}

          {actionType === 'reject' && (
            <Form.Item
              label="Rejection Reason"
              name="comment"
              rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
            >
              <TextArea
                rows={4}
                placeholder="Enter reason for rejecting this receivable..."
                size="large"
              />
            </Form.Item>
          )}

          {actionType === 'approve' && (
            <Form.Item label="Comments (Optional)" name="comment">
              <TextArea
                rows={3}
                placeholder="Add any comments or notes..."
                size="large"
              />
            </Form.Item>
          )}

          {actionType === 'paid' && (
            <div>
              <Text>Are you sure you want to mark this receivable as fully paid?</Text>
            </div>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => { setActionModalVisible(false); actionForm.resetFields(); }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                danger={actionType === 'reject'}
                style={
                  actionType === 'approve'
                    ? { background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)', border: 'none' }
                    : actionType === 'paid'
                    ? { background: '#52c41a', border: 'none' }
                    : undefined
                }
              >
                {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Confirm'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Recording Modal */}
      <Modal
        title="Record Payment"
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleRecordPayment}
        >
          {selectedReceivable && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
              <Text strong>{selectedReceivable.memberName}</Text>
              <br />
              <Text type="secondary">{selectedReceivable.categoryDisplay}</Text>
              <br />
              <Text>Total Amount: <Text strong style={{ color: '#00d084' }}>ZWG {selectedReceivable.amount.toLocaleString()}</Text></Text>
              <br />
              <Text>Outstanding: <Text strong style={{ color: '#ff6900' }}>ZWG {(selectedReceivable.amountOutstanding || selectedReceivable.amount).toLocaleString()}</Text></Text>
            </div>
          )}

          <Form.Item
            label="Payment Amount (ZWG)"
            name="amount"
            rules={[
              { required: true, message: 'Please enter payment amount' },
              {
                validator: (_, value) => {
                  const maxAmount = selectedReceivable?.amountOutstanding || selectedReceivable?.amount || 0;
                  if (value > maxAmount) {
                    return Promise.reject(new Error(`Amount cannot exceed ZWG ${maxAmount.toLocaleString()}`));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              placeholder="0.00"
              size="large"
              style={{ width: '100%' }}
              min={0}
              max={selectedReceivable?.amountOutstanding || selectedReceivable?.amount}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            label="Payment Date"
            name="paymentDate"
            rules={[{ required: true, message: 'Please select payment date' }]}
            initialValue={dayjs()}
          >
            <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select placeholder="Select payment method" size="large">
              <Select.Option value="Mobile Money">Mobile Money</Select.Option>
              <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
              <Select.Option value="Cash">Cash</Select.Option>
              <Select.Option value="Cheque">Cheque</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Reference/Transaction Number" name="reference">
            <Input placeholder="Enter reference number" size="large" />
          </Form.Item>

          <Form.Item label="Notes (Optional)" name="notes">
            <TextArea
              rows={2}
              placeholder="Add any notes about this payment..."
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => { setPaymentModalVisible(false); paymentForm.resetFields(); }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<MoneyCollectOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                  border: 'none',
                }}
              >
                Record Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
