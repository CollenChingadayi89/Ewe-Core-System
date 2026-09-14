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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { usePayablesStore } from '../../store/payablesStore';
import type { Payable } from '../../types/index';

const { TextArea } = Input;
const { Text, Title } = Typography;

export const PayablesPage = () => {
  const { user } = useAuthStore();
  const {
    payables,
    clients,
    loading,
    fetchPayables,
    submitPayable,
    approvePayable,
    rejectPayable,
    markAsPaid,
    updatePayableStatus
  } = usePayablesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'paid'>('approve');
  const [form] = Form.useForm();
  const [actionForm] = Form.useForm();

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  // Get my payables (created by me)
  const myPayables = payables.filter(p => p.createdBy === user?.id);

  // Determine which dataset to show
  const displayPayables = activeTab === 'all' ? payables : myPayables;

  // Calculate statistics
  const stats = {
    total: displayPayables.reduce((sum, p) => sum + p.amount, 0),
    pending: displayPayables.filter(p => p.status === 'pending').length,
    dueThisWeek: displayPayables.filter(p => {
      const dueDate = dayjs(p.collectionDate, 'DD/MM/YYYY');
      const today = dayjs();
      const weekFromNow = today.add(7, 'day');
      return dueDate.isAfter(today) && dueDate.isBefore(weekFromNow) && (p.status === 'approved' || p.status === 'scheduled');
    }).length,
    overdue: displayPayables.filter(p => p.status === 'overdue').length,
  };

  // Filter payables
  const filteredPayables = displayPayables.filter((payable) => {
    const matchesSearch = !searchTerm ||
      payable.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || payable.status === statusFilter;
    const matchesDepartment = !departmentFilter || payable.department === departmentFilter;
    const matchesPriority = !priorityFilter || payable.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesDepartment && matchesPriority;
  });

  const handleSubmitPayable = async (values: any) => {
    try {
      const selectedClient = clients.find(c => c.id === values.clientId);

      await submitPayable(user!.id, user!.name, {
        clientId: values.clientId,
        clientName: selectedClient?.name || values.clientName,
        contactPerson: selectedClient?.contact || values.contactPerson,
        phone: selectedClient?.phone || values.phone,
        email: selectedClient?.email || values.email,
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate.format('DD/MM/YYYY'),
        amount: values.amount,
        currency: 'ZWG',
        dueDate: values.dueDate.format('DD/MM/YYYY'),
        collectionDate: values.collectionDate.format('DD/MM/YYYY'),
        department: values.department,
        description: values.description,
        paymentMethod: values.paymentMethod,
        priority: values.priority,
        notes: values.notes,
        attachments: values.attachments?.fileList?.map((file: any) => file.name) || [],
      });

      message.success('Payable request submitted successfully!');
      setRequestModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit payable request');
    }
  };

  const handleViewDetails = (payable: Payable) => {
    setSelectedPayable(payable);
    setDetailsDrawerVisible(true);
  };

  const handleOpenActionModal = (payable: Payable, type: 'approve' | 'reject' | 'paid') => {
    setSelectedPayable(payable);
    setActionType(type);
    setActionModalVisible(true);
  };

  const handleSubmitAction = async (values: any) => {
    if (!selectedPayable || !user) return;

    try {
      if (actionType === 'approve') {
        await approvePayable(selectedPayable.id, user.id, user.name, values.comment);
        message.success('Payable approved successfully!');
      } else if (actionType === 'reject') {
        await rejectPayable(selectedPayable.id, user.id, user.name, values.comment);
        message.success('Payable rejected successfully!');
      } else if (actionType === 'paid') {
        await markAsPaid(selectedPayable.id, user.id, user.name);
        message.success('Payable marked as paid successfully!');
      }

      setActionModalVisible(false);
      setDetailsDrawerVisible(false);
      actionForm.resetFields();
    } catch (error) {
      message.error('Failed to process action');
    }
  };

  const handleExport = () => {
    message.info('Exporting payables to Excel...');
  };

  // Table columns
  const columns: ColumnsType<Payable> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      fixed: 'left',
      render: (id: string) => <Text strong>{id}</Text>,
    },
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 200,
      render: (name: string, record: Payable) => (
        <Space>
          <Avatar style={{ backgroundColor: '#00d084' }}>
            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Avatar>
          <div>
            <div><Text strong>{name}</Text></div>
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.contactPerson}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Invoice',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
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
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: 'Collection Date',
      dataIndex: 'collectionDate',
      key: 'collectionDate',
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
      width: 280,
      render: (_: any, record: Payable) => (
        <Space>
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
        </Space>
      ),
    },
  ];

  // Filters configuration
  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by client, invoice, or description...',
      value: searchTerm,
      onChange: setSearchTerm,
      width: 350,
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
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Rejected', value: 'rejected' },
      ],
      width: 150,
    },
    {
      type: 'select',
      label: 'Department',
      placeholder: 'All Departments',
      value: departmentFilter,
      onChange: setDepartmentFilter,
      options: [
        { label: 'Finance', value: 'Finance' },
        { label: 'Operations', value: 'Operations' },
        { label: 'HR', value: 'HR' },
        { label: 'IT', value: 'IT' },
        { label: 'Marketing', value: 'Marketing' },
        { label: 'Projects', value: 'Projects' },
        { label: 'Facilities', value: 'Facilities' },
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
    setDepartmentFilter(undefined);
    setPriorityFilter(undefined);
  };

  return (
    <div>
      <PageHeader
        title="Payables Management"
        subtitle="Track and manage client payment requests"
        breadcrumbs={[
          { title: 'Finance' },
          { title: 'Payables' },
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
              New Payable Request
            </Button>
          </Space>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Payables"
            value={`ZWG ${stats.total.toLocaleString()}`}
            icon={<DollarOutlined />}
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
            label: 'All Payables',
          },
          {
            key: 'my-payables',
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
        dataSource={filteredPayables}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
      />

      {/* Request Modal */}
      <Modal
        title="New Payable Request"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitPayable}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Select Client/Vendor"
                name="clientId"
                rules={[{ required: true, message: 'Please select a client' }]}
              >
                <Select
                  placeholder="Select existing client"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                >
                  {clients.map(client => (
                    <Select.Option key={client.id} value={client.id}>
                      {client.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Invoice Number"
                name="invoiceNumber"
                rules={[{ required: true, message: 'Please enter invoice number' }]}
              >
                <Input placeholder="INV-2026-001" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Invoice Date"
                name="invoiceDate"
                rules={[{ required: true, message: 'Please select invoice date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Amount (ZWG)"
                name="amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  step={100}
                  formatter={value => `ZWG ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/ZWG\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Due Date"
                name="dueDate"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Collection Date"
                name="collectionDate"
                rules={[{ required: true, message: 'Please select collection date' }]}
                tooltip="Date when client will come to collect payment"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department" size="large">
                  <Select.Option value="Finance">Finance</Select.Option>
                  <Select.Option value="Operations">Operations</Select.Option>
                  <Select.Option value="HR">HR</Select.Option>
                  <Select.Option value="IT">IT</Select.Option>
                  <Select.Option value="Marketing">Marketing</Select.Option>
                  <Select.Option value="Projects">Projects</Select.Option>
                  <Select.Option value="Facilities">Facilities</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Payment Method"
                name="paymentMethod"
                rules={[{ required: true, message: 'Please select payment method' }]}
              >
                <Select placeholder="Select payment method" size="large">
                  <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
                  <Select.Option value="Cash">Cash</Select.Option>
                  <Select.Option value="Cheque">Cheque</Select.Option>
                  <Select.Option value="Mobile Money">Mobile Money</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Priority"
                name="priority"
                initialValue="medium"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select size="large">
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea
              rows={4}
              placeholder="Describe the purpose of this payable..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="Additional notes or instructions..."
              maxLength={300}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Attachments"
            name="attachments"
            tooltip="Upload invoices, receipts, or supporting documents"
          >
            <Upload
              maxCount={5}
              accept="image/*,.pdf,.doc,.docx"
              beforeUpload={() => false}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>Upload Documents</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setRequestModalVisible(false);
                form.resetFields();
              }}>
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
        title="Payable Details"
        placement="right"
        width={600}
        open={detailsDrawerVisible}
        onClose={() => setDetailsDrawerVisible(false)}
      >
        {selectedPayable && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Payable ID">
                <Text strong>{selectedPayable.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Client">
                <Space>
                  <UserOutlined />
                  <Text strong>{selectedPayable.clientName}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Contact Person">
                {selectedPayable.contactPerson || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {selectedPayable.phone || 'N/A'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {selectedPayable.email || 'N/A'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Number">
                {selectedPayable.invoiceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Date">
                {selectedPayable.invoiceDate}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong style={{ color: '#00d084', fontSize: '16px' }}>
                  ZWG {selectedPayable.amount.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {selectedPayable.dueDate}
              </Descriptions.Item>
              <Descriptions.Item label="Collection Date">
                <Space>
                  <CalendarOutlined />
                  <Text strong>{selectedPayable.collectionDate}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedPayable.department}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {selectedPayable.paymentMethod || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedPayable.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={selectedPayable.priority === 'high' ? 'red' : selectedPayable.priority === 'medium' ? 'orange' : 'blue'}>
                  {selectedPayable.priority.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedPayable.description}
              </Descriptions.Item>
              {selectedPayable.notes && (
                <Descriptions.Item label="Notes">
                  {selectedPayable.notes}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created By">
                {selectedPayable.createdByName} on {selectedPayable.createdAt}
              </Descriptions.Item>
              {selectedPayable.approvedBy && (
                <Descriptions.Item label="Approved By">
                  {selectedPayable.approvedBy} on {selectedPayable.approvedAt}
                </Descriptions.Item>
              )}
              {selectedPayable.paidBy && (
                <Descriptions.Item label="Paid By">
                  {selectedPayable.paidBy} on {selectedPayable.paidAt}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedPayable.attachments && selectedPayable.attachments.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: '24px', marginBottom: '12px' }}>
                  Attachments
                </Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedPayable.attachments.map((file, index) => (
                    <div key={index} style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text>{file}</Text>
                    </div>
                  ))}
                </Space>
              </>
            )}

            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {selectedPayable.status === 'pending' && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleOpenActionModal(selectedPayable, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleOpenActionModal(selectedPayable, 'reject')}
                  >
                    Reject
                  </Button>
                </>
              )}
              {selectedPayable.status === 'approved' && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleOpenActionModal(selectedPayable, 'paid')}
                  style={{ background: '#52c41a' }}
                >
                  Mark as Paid
                </Button>
              )}
            </div>
          </>
        )}
      </Drawer>

      {/* Action Modal (Approve/Reject/Paid) */}
      <Modal
        title={
          actionType === 'approve'
            ? 'Approve Payable'
            : actionType === 'reject'
            ? 'Reject Payable'
            : 'Mark as Paid'
        }
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          actionForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={actionForm} layout="vertical" onFinish={handleSubmitAction}>
          {selectedPayable && (
            <>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Client: {selectedPayable.clientName}</Text>
                  <Text>Amount: ZWG {selectedPayable.amount.toLocaleString()}</Text>
                  <Text>Collection Date: {selectedPayable.collectionDate}</Text>
                </Space>
              </div>

              {actionType !== 'paid' && (
                <Form.Item
                  label="Comments"
                  name="comment"
                  rules={actionType === 'reject' ? [{ required: true, message: 'Please provide reason for rejection' }] : []}
                >
                  <TextArea
                    rows={4}
                    placeholder={
                      actionType === 'approve'
                        ? 'Add optional comments...'
                        : 'Please provide reason for rejection...'
                    }
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              )}

              {actionType === 'paid' && (
                <div style={{ marginBottom: '16px' }}>
                  <Text>
                    Are you sure you want to mark this payable as paid? This action confirms that the payment
                    has been successfully disbursed to the client.
                  </Text>
                </div>
              )}
            </>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ float: 'right' }}>
              <Button
                onClick={() => {
                  setActionModalVisible(false);
                  actionForm.resetFields();
                }}
              >
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
                {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Confirm Payment'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
