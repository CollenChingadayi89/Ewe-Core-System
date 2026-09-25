import { useState, useEffect } from 'react';
import { Button, Avatar, Space, Row, Col, Modal, Form, Input, Select, InputNumber, message, Drawer, Descriptions, Timeline, Typography, Upload, Checkbox, Card, Table } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckOutlined,
  ReconciliationOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  CloseOutlined,
  InboxOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { usePettyCashStore } from '../../store/pettyCashStore';
import { generatePettyCashPDF } from '../../utils/pdfGenerator';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;

interface PettyCashRequest {
  id: string;
  purpose: string;
  requestedBy: string;
  department: string;
  amount: number;
  currency: string;
  requestDate: string;
  status: string;
  avatar: string;
  justification?: string;
  receiptExpected?: boolean;
  accountCode?: string;
}

export const PettyCashPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ZWG');

  // Zustand stores
  const { user } = useAuthStore();
  const {
    pettyCashRequests,
    selectedRequest,
    loading,
    error,
    fetchRequests,
    fetchRequestById,
    createRequest,
    deleteRequest,
    clearSelectedRequest,
  } = usePettyCashStore();

  // Fetch petty cash requests on mount
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Map API petty cash to component format
  const mapApiPettyCashToComponent = (apiPettyCash: any): PettyCashRequest => ({
    id: apiPettyCash.petty_cash_number || apiPettyCash.id,
    purpose: apiPettyCash.description || apiPettyCash.purpose || 'N/A',
    requestedBy: apiPettyCash.employee_name || 'Unknown',
    department: apiPettyCash.employee_department || 'N/A',
    amount: parseFloat(apiPettyCash.amount) || 0,
    currency: apiPettyCash.currency || 'ZWG',
    requestDate: apiPettyCash.request_date ? dayjs(apiPettyCash.request_date).format('DD/MM/YYYY') : '',
    status: apiPettyCash.status_display || apiPettyCash.status || 'Pending',
    avatar: (apiPettyCash.employee_name || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase(),
    justification: apiPettyCash.justification,
    receiptExpected: apiPettyCash.receipt_expected,
    accountCode: apiPettyCash.account_code,
  });

  const mappedRequests = pettyCashRequests.map(mapApiPettyCashToComponent);

  // Filter requests by selected currency for statistics
  const getFilteredByCurrency = (requests: PettyCashRequest[]) => {
    if (currencyFilter === 'all') return requests;
    return requests.filter(r => r.currency === currencyFilter);
  };

  const currencyFilteredRequests = getFilteredByCurrency(mappedRequests);

  // Calculate statistics by currency
  const totalRequests = currencyFilteredRequests.length;

  const calculateAmountByCurrency = (requests: PettyCashRequest[]) => {
    const zwg = requests.filter(r => r.currency === 'ZWG').reduce((sum, r) => sum + r.amount, 0);
    const usd = requests.filter(r => r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0);
    return { zwg, usd };
  };

  const pending = calculateAmountByCurrency(currencyFilteredRequests.filter(r => r.status === 'Pending'));
  const disbursed = calculateAmountByCurrency(currencyFilteredRequests.filter(r => r.status === 'Disbursed' || r.status === 'Approved'));
  const reconciled = calculateAmountByCurrency(currencyFilteredRequests.filter(r => r.status === 'Reconciled' || r.status === 'Completed'));

  // Format multi-currency display
  const formatMultiCurrency = (zwg: number, usd: number) => {
    if (currencyFilter === 'ZWG') return `ZWG ${zwg.toLocaleString()}`;
    if (currencyFilter === 'USD') return `USD ${usd.toLocaleString()}`;
    // Show both currencies when 'all' is selected
    const parts = [];
    if (zwg > 0) parts.push(`ZWG ${zwg.toLocaleString()}`);
    if (usd > 0) parts.push(`USD ${usd.toLocaleString()}`);
    return parts.length > 0 ? parts.join(' | ') : 'ZWG 0';
  };

  // Filter petty cash requests
  const filteredRequests = mappedRequests.filter((request) => {
    const matchesSearch =
      request.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesDepartment = !departmentFilter || request.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Handle request submission
  const handleSubmitRequest = async (values: any) => {
    try {
      // Check if user is logged in
      if (!user || !user.id) {
        message.error('User not logged in. Please log in again.');
        return;
      }

      // Extract files from fileList
      const files = fileList.map(file => file.originFileObj as File).filter(Boolean);

      // Ensure line items have all required fields with proper values
      const lineItems = (values.line_items || []).map((item: any) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unit_price = parseFloat(item.unit_price) || 0;
        const amount = quantity * unit_price; // Calculate amount from quantity × unit_price

        return {
          description: item.description || '',
          currency: item.currency || selectedCurrency,
          quantity: quantity,
          unit_price: unit_price,
          amount: amount,
        };
      });

      const result = await createRequest({
        employee: user.id, // Add employee ID from logged-in user
        category: values.category,
        purpose: values.purpose,
        amount: values.amount,
        currency: values.currency || 'ZWG',
        justification: values.justification,
        receipt_expected: values.receiptExpected ?? true,
        account_code: values.accountCode,
        priority: values.priority || 'medium',
        status: 'pending',
        notes: values.notes,
        line_items: lineItems,
      }, files);

      if (result) {
        setRequestModalVisible(false);
        form.resetFields();
        setFileList([]);
        setSelectedCurrency('ZWG');
      }
    } catch (error) {
      console.error('Failed to submit petty cash request:', error);
    }
  };

  // Handle view details
  const handleViewDetails = async (request: any) => {
    try {
      await fetchRequestById(request.id);
      setDetailsDrawerVisible(true);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      message.error('Failed to load request details');
    }
  };

  // Handle drawer close
  const handleCloseDetails = () => {
    setDetailsDrawerVisible(false);
    clearSelectedRequest();
  };

  // Handle PDF print
  const handlePrintPDF = async () => {
    if (!selectedRequest) {
      message.error('No request selected');
      return;
    }

    try {
      message.loading({ content: 'Generating PDF...', key: 'pdf-gen' });
      await generatePettyCashPDF(selectedRequest);
      message.success({ content: 'PDF generated successfully', key: 'pdf-gen', duration: 2 });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      message.error({ content: 'Failed to generate PDF', key: 'pdf-gen', duration: 2 });
    }
  };

  // Handle approval
  const handleApprove = () => {
    message.success('Request approved successfully');
    handleCloseDetails();
  };

  // Handle rejection
  const handleReject = () => {
    message.success('Request rejected');
    handleCloseDetails();
  };

  // Filters configuration
  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by ID, purpose, or requester...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 300,
    },
    {
      type: 'select',
      label: 'Department',
      placeholder: 'All Departments',
      onChange: setDepartmentFilter,
      value: departmentFilter,
      width: 180,
      options: [
        { label: 'HR', value: 'HR' },
        { label: 'Finance', value: 'Finance' },
        { label: 'IT', value: 'IT' },
        { label: 'Operations', value: 'Operations' },
      ],
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 180,
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Disbursed', value: 'Disbursed' },
        { label: 'Reconciled', value: 'Reconciled' },
        { label: 'Rejected', value: 'Rejected' },
      ],
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setDepartmentFilter(undefined);
    setCurrencyFilter('all');
  };

  const columns: ColumnsType<PettyCashRequest> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <Text strong style={{ color: '#0693e3' }}>{id}</Text>,
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      width: 180,
      render: (name: string, record: PettyCashRequest) => (
        <Space>
          <Avatar style={{ background: '#00d084' }}>{record.avatar}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.department}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 250,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number, record: PettyCashRequest) => (
        <Text strong style={{ color: '#00d084', fontSize: '15px' }}>
          {record.currency} {amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 130,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'Pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove()}
              />
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleReject()}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Petty Cash Management"
        subtitle={`${filteredRequests.length} request${filteredRequests.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[{ title: 'Finance' }, { title: 'Petty Cash' }]}
        actions={
          <Space>
            <Select
              value={currencyFilter}
              onChange={setCurrencyFilter}
              style={{ width: 150 }}
              size="large"
            >
              <Select.Option value="all">All Currencies</Select.Option>
              <Select.Option value="ZWG">ZWG Only</Select.Option>
              <Select.Option value="USD">USD Only</Select.Option>
            </Select>
            <Button icon={<DownloadOutlined />} style={{ borderRadius: '8px' }}>
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setRequestModalVisible(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
              }}
            >
              Request Petty Cash
            </Button>
          </Space>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Total Requests"
            value={totalRequests}
            icon={<FileProtectOutlined />}
            iconBg="rgba(103, 58, 183, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Pending Amount"
            value={formatMultiCurrency(pending.zwg, pending.usd)}
            icon={<ClockCircleOutlined />}
            iconBg="rgba(255, 105, 0, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Disbursed"
            value={formatMultiCurrency(disbursed.zwg, disbursed.usd)}
            icon={<WalletOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Reconciled"
            value={formatMultiCurrency(reconciled.zwg, reconciled.usd)}
            icon={<ReconciliationOutlined />}
            iconBg="rgba(59, 130, 246, 0.1)"
          />
        </Col>
      </Row>

      {/* Filters */}
      <FilterBar filters={filters} onSearch={setSearchTerm} onReset={handleReset} />

      {/* Petty Cash Table */}
      <DataTable
        columns={columns}
        dataSource={filteredRequests}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} entries`,
        }}
      />

      {/* Request Modal */}
      <Modal
        title="Request Petty Cash"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
          setFileList([]);
          setSelectedCurrency('ZWG');
        }}
        onOk={form.submit}
        width={1200}
        style={{ top: 20 }}
        okText="Submit Request"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
            border: 'none',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRequest}
          initialValues={{ currency: 'ZWG', receiptExpected: true, priority: 'medium' }}
        >
          {/* Basic Information - 4 Column Layout */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Currency"
                name="currency"
                rules={[{ required: true, message: 'Please select currency' }]}
              >
                <Select
                  placeholder="Select currency"
                  onChange={(value) => setSelectedCurrency(value)}
                >
                  <Select.Option value="ZWG">ZWG - Zimbabwe Gold</Select.Option>
                  <Select.Option value="USD">USD - US Dollar</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Amount"
                name="amount"
                rules={[
                  { required: true, message: 'Please enter amount' },
                  { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
                ]}
                tooltip="Will auto-calculate if you add line items below"
              >
                <InputNumber
                  key={selectedCurrency}
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  placeholder="Enter amount"
                  formatter={(value) => `${selectedCurrency} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/[A-Z]+\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  <Select.Option value="office_supplies">Office Supplies</Select.Option>
                  <Select.Option value="transport">Transportation</Select.Option>
                  <Select.Option value="refreshments">Meals & Entertainment</Select.Option>
                  <Select.Option value="maintenance">Maintenance</Select.Option>
                  <Select.Option value="utilities">Utilities</Select.Option>
                  <Select.Option value="miscellaneous">Miscellaneous</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Purpose"
            name="purpose"
            rules={[{ required: true, message: 'Please enter purpose' }]}
          >
            <Input placeholder="Brief purpose of request" />
          </Form.Item>

          {/* Line Items Section */}
          <Card
            size="small"
            title="Line Items"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Optional: Itemize your request for detailed tracking
              </Text>
            }
            style={{ marginBottom: 16 }}
          >
            <Form.List name="line_items">
              {(fields, { add, remove }) => (
                <>
                  {fields.length > 0 && (
                    <Table
                      size="small"
                      pagination={false}
                      dataSource={fields}
                      rowKey="key"
                      columns={[
                        {
                          title: 'Description',
                          key: 'description',
                          width: '30%',
                          render: (_, field) => (
                            <Form.Item
                              {...field}
                              name={[field.name, 'description']}
                              rules={[{ required: true, message: 'Required' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="Item description" />
                            </Form.Item>
                          ),
                        },
                        {
                          title: 'Currency',
                          key: 'currency',
                          width: '10%',
                          render: (_, field) => (
                            <Form.Item
                              {...field}
                              name={[field.name, 'currency']}
                              rules={[{ required: true, message: 'Required' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Select placeholder="Currency" style={{ width: '100%' }}>
                                <Select.Option value="ZWG">ZWG</Select.Option>
                                <Select.Option value="USD">USD</Select.Option>
                              </Select>
                            </Form.Item>
                          ),
                        },
                        {
                          title: 'Quantity',
                          key: 'quantity',
                          width: '12%',
                          render: (_, field) => (
                            <Form.Item
                              {...field}
                              name={[field.name, 'quantity']}
                              rules={[
                                { required: true, message: 'Required' },
                                { type: 'number', min: 0.01, message: 'Must be > 0' },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                min={0.01}
                                step={1}
                                placeholder="Qty"
                                style={{ width: '100%' }}
                                onChange={(value) => {
                                  const unitPrice = form.getFieldValue(['line_items', field.name, 'unit_price']) || 0;
                                  const calculatedAmount = (value || 0) * unitPrice;
                                  form.setFieldValue(['line_items', field.name, 'amount'], calculatedAmount);

                                  // Update grand total
                                  const lineItems = form.getFieldValue('line_items') || [];
                                  const grandTotal = lineItems.reduce((sum: number, item: any, idx: number) => {
                                    if (idx === field.name) {
                                      return sum + calculatedAmount;
                                    }
                                    return sum + (parseFloat(item?.amount || 0));
                                  }, 0);
                                  form.setFieldValue('amount', grandTotal);
                                }}
                              />
                            </Form.Item>
                          ),
                        },
                        {
                          title: 'Unit Price',
                          key: 'unit_price',
                          width: '18%',
                          render: (_, field) => (
                            <Form.Item
                              {...field}
                              name={[field.name, 'unit_price']}
                              rules={[
                                { required: true, message: 'Required' },
                                { type: 'number', min: 0, message: 'Cannot be negative' },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                min={0}
                                step={100}
                                placeholder="Price"
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/,/g, '') as any}
                                onChange={(value) => {
                                  const quantity = form.getFieldValue(['line_items', field.name, 'quantity']) || 0;
                                  const calculatedAmount = quantity * (value || 0);
                                  form.setFieldValue(['line_items', field.name, 'amount'], calculatedAmount);

                                  // Update grand total
                                  const lineItems = form.getFieldValue('line_items') || [];
                                  const grandTotal = lineItems.reduce((sum: number, item: any, idx: number) => {
                                    if (idx === field.name) {
                                      return sum + calculatedAmount;
                                    }
                                    return sum + (parseFloat(item?.amount || 0));
                                  }, 0);
                                  form.setFieldValue('amount', grandTotal);
                                }}
                              />
                            </Form.Item>
                          ),
                        },
                        {
                          title: 'Total',
                          key: 'amount',
                          width: '18%',
                          render: (_, field) => (
                            <Form.Item noStyle shouldUpdate={(prev, curr) => {
                              const prevQty = prev.line_items?.[field.name]?.quantity;
                              const currQty = curr.line_items?.[field.name]?.quantity;
                              const prevPrice = prev.line_items?.[field.name]?.unit_price;
                              const currPrice = curr.line_items?.[field.name]?.unit_price;
                              const prevCurrency = prev.line_items?.[field.name]?.currency;
                              const currCurrency = curr.line_items?.[field.name]?.currency;
                              return prevQty !== currQty || prevPrice !== currPrice || prevCurrency !== currCurrency;
                            }}>
                              {({ getFieldValue }) => {
                                const amount = getFieldValue(['line_items', field.name, 'amount']) || 0;
                                const currency = getFieldValue(['line_items', field.name, 'currency']) || 'ZWG';
                                return (
                                  <Text strong style={{ fontSize: 14 }}>
                                    {currency} {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                );
                              }}
                            </Form.Item>
                          ),
                        },
                        {
                          title: '',
                          key: 'actions',
                          width: '10%',
                          render: (_, field) => (
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => {
                                remove(field.name);
                                // Recalculate grand total after removal
                                setTimeout(() => {
                                  const lineItems = form.getFieldValue('line_items') || [];
                                  const grandTotal = lineItems.reduce((sum: number, item: any) => {
                                    return sum + (parseFloat(item?.amount || 0));
                                  }, 0);
                                  form.setFieldValue('amount', grandTotal);
                                }, 0);
                              }}
                              size="small"
                            />
                          ),
                        },
                      ]}
                    />
                  )}

                  <Button
                    type="dashed"
                    onClick={() => add({ description: '', currency: selectedCurrency, quantity: 1, unit_price: 0, amount: 0 })}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: fields.length > 0 ? 8 : 0 }}
                  >
                    Add Line Item
                  </Button>

                  {/* Grand Total Display */}
                  {fields.length > 0 && (
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.amount !== curr.amount}>
                      {({ getFieldValue }) => {
                        const grandTotal = getFieldValue('amount') || 0;

                        return (
                          <div style={{
                            marginTop: 16,
                            padding: '12px 16px',
                            background: '#f0f2f5',
                            borderRadius: 4,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Text strong style={{ fontSize: 16 }}>Grand Total:</Text>
                            <Text strong style={{ fontSize: 18, color: '#00d084' }}>
                              {selectedCurrency} {parseFloat(grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                          </div>
                        );
                      }}
                    </Form.Item>
                  )}
                </>
              )}
            </Form.List>
          </Card>

          {/* Additional Details - 2 Column Layout */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.amount !== currentValues.amount}
              >
                {({ getFieldValue }) => {
                  const amount = getFieldValue('amount');
                  return (
                    <Form.Item
                      label="Justification"
                      name="justification"
                      rules={[
                        {
                          required: amount > 5000,
                          message: 'Justification is required for amounts greater than 5000',
                        },
                      ]}
                      extra={amount > 5000 ? 'Required for high-value requests (> 5000)' : 'Optional'}
                    >
                      <TextArea
                        rows={3}
                        placeholder="Provide detailed justification for this expense..."
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>

              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    label="Account/GL Code"
                    name="accountCode"
                  >
                    <Input placeholder="e.g., 5100-001" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label=" "
                    name="receiptExpected"
                    valuePropName="checked"
                  >
                    <Checkbox>Receipt Expected</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              <Form.Item label="Additional Notes" name="notes">
                <TextArea
                  rows={3}
                  placeholder="Any additional information..."
                  maxLength={300}
                  showCount
                />
              </Form.Item>

              <Form.Item label="Supporting Documents">
                <Dragger
                  multiple
                  maxCount={5}
                  fileList={fileList}
                  beforeUpload={(file) => {
                    // Validate file type
                    const allowedTypes = [
                      'application/pdf',
                      'image/jpeg',
                      'image/png',
                      'image/jpg',
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    ];
                    if (!allowedTypes.includes(file.type)) {
                      message.error(`${file.name} is not a valid file type. Only PDF, images, and Word documents are allowed.`);
                      return false;
                    }

                    // Validate file size (max 10MB)
                    const maxSize = 10 * 1024 * 1024;
                    if (file.size > maxSize) {
                      message.error(`${file.name} is too large. Maximum file size is 10MB.`);
                      return false;
                    }

                    // Add to file list
                    setFileList((prev) => [...prev, file as any]);
                    return false; // Prevent auto upload
                  }}
                  onRemove={(file) => {
                    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: '#00d084' }} />
                  </p>
                  <p className="ant-upload-text">Click or drag files to upload</p>
                  <p className="ant-upload-hint">
                    Support for PDF, images, Word documents. Maximum 5 files, 10MB each.
                  </p>
                </Dragger>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Details Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 40 }}>
            <Space>
              <FileTextOutlined />
              <span>Petty Cash Request Details</span>
            </Space>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrintPDF}
              size="middle"
            >
              Print PDF
            </Button>
          </div>
        }
        placement="right"
        width={750}
        onClose={handleCloseDetails}
        open={detailsDrawerVisible}
      >
        {selectedRequest && (
          <div style={{ marginBottom: 80 }}>
            {/* Header Card */}
            <Card style={{ marginBottom: 16, background: '#f0f7ff' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Request Number</Text>
                    <Text strong style={{ fontSize: 18, color: '#0693e3' }}>
                      {selectedRequest.petty_cash_number}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <StatusTag status={selectedRequest.status} />
                </Col>
              </Row>
            </Card>

            {/* Requester Information */}
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Requester Information</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Employee Name">
                  {selectedRequest.employee_name}
                </Descriptions.Item>
                <Descriptions.Item label="Employee Number">
                  {selectedRequest.employee_number}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedRequest.employee_department}
                </Descriptions.Item>
                <Descriptions.Item label="Request Date">
                  <Space>
                    <CalendarOutlined />
                    {dayjs(selectedRequest.request_date).format('DD/MM/YYYY')}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Financial Summary */}
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Financial Summary</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Total Amount</Text>
                    <div>
                      <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                        {selectedRequest.currency_display} {selectedRequest.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ padding: 16, background: '#f0f2f5', borderRadius: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Category</Text>
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {selectedRequest.category_display}
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Currency">
                  {selectedRequest.currency_display}
                </Descriptions.Item>
                <Descriptions.Item label="Priority">
                  {selectedRequest.priority_display}
                </Descriptions.Item>
                {selectedRequest.account_code && (
                  <Descriptions.Item label="Account/GL Code">
                    {selectedRequest.account_code}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Receipt Expected">
                  {selectedRequest.receipt_expected ? '✅ Yes' : '❌ No'}
                </Descriptions.Item>
                {selectedRequest.required_by_date && (
                  <Descriptions.Item label="Required By">
                    {dayjs(selectedRequest.required_by_date).format('DD/MM/YYYY')}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Purpose and Justification */}
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Purpose & Justification</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Purpose</Text>
                <div style={{ marginTop: 4 }}>
                  <Text>{selectedRequest.purpose}</Text>
                </div>
              </div>
              {selectedRequest.justification && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Justification</Text>
                  <div style={{ marginTop: 4, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.justification}</Text>
                  </div>
                </div>
              )}
              {selectedRequest.notes && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Additional Notes</Text>
                  <div style={{ marginTop: 4, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.notes}</Text>
                  </div>
                </div>
              )}
            </Card>

            {/* Line Items */}
            {selectedRequest.line_items && selectedRequest.line_items.length > 0 && (
              <Card
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>Line Items ({selectedRequest.line_items.length})</span>
                  </Space>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Table
                  dataSource={selectedRequest.line_items}
                  pagination={false}
                  size="small"
                  rowKey={(_, index) => index?.toString() || '0'}
                  columns={[
                    {
                      title: '#',
                      key: 'index',
                      width: 50,
                      render: (_, __, index) => index + 1,
                    },
                    {
                      title: 'Description',
                      dataIndex: 'description',
                      key: 'description',
                    },
                    {
                      title: 'Currency',
                      dataIndex: 'currency',
                      key: 'currency',
                      width: 100,
                    },
                    {
                      title: 'Quantity',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      width: 100,
                      align: 'right' as const,
                      render: (qty) => parseFloat(qty).toLocaleString(),
                    },
                    {
                      title: 'Unit Price',
                      dataIndex: 'unit_price',
                      key: 'unit_price',
                      width: 120,
                      align: 'right' as const,
                      render: (price, record) => `${record.currency} ${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    },
                    {
                      title: 'Total',
                      dataIndex: 'amount',
                      key: 'amount',
                      width: 150,
                      align: 'right' as const,
                      render: (amount, record) => (
                        <Text strong style={{ color: '#52c41a' }}>
                          {record.currency} {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      ),
                    },
                  ]}
                  summary={(pageData) => {
                    const total = pageData.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={5} align="right">
                            <Text strong>Grand Total:</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                              {selectedRequest.currency_display} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    );
                  }}
                />
              </Card>
            )}

            {/* Verification Information */}
            {selectedRequest.verified_by && (
              <Card
                title={
                  <Space>
                    <CheckOutlined />
                    <span>Verification Information</span>
                  </Space>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Verified By">
                    {selectedRequest.verified_by_name}
                  </Descriptions.Item>
                  {selectedRequest.verified_date && (
                    <Descriptions.Item label="Verification Date">
                      {dayjs(selectedRequest.verified_date).format('DD/MM/YYYY HH:mm')}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Approval Information */}
            {(selectedRequest.approved_by || selectedRequest.rejection_reason) && (
              <Card
                title={
                  <Space>
                    <CheckOutlined />
                    <span>Approval Information</span>
                  </Space>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={1} size="small">
                  {selectedRequest.approved_by_name && (
                    <Descriptions.Item label="Approved By">
                      {selectedRequest.approved_by_name}
                    </Descriptions.Item>
                  )}
                  {selectedRequest.approved_date && (
                    <Descriptions.Item label="Approval Date">
                      {dayjs(selectedRequest.approved_date).format('DD/MM/YYYY HH:mm')}
                    </Descriptions.Item>
                  )}
                  {selectedRequest.rejection_reason && (
                    <Descriptions.Item label="Rejection Reason">
                      <div style={{ padding: 12, background: '#fff1f0', borderRadius: 4, border: '1px solid #ffa39e' }}>
                        <Text type="danger">{selectedRequest.rejection_reason}</Text>
                      </div>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Disbursement Information */}
            {selectedRequest.disbursed_by && (
              <Card
                title={
                  <Space>
                    <WalletOutlined />
                    <span>Disbursement Information</span>
                  </Space>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Disbursed By">
                    {selectedRequest.disbursed_by_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Disbursement Date">
                    {dayjs(selectedRequest.disbursed_date).format('DD/MM/YYYY HH:mm')}
                  </Descriptions.Item>
                  {selectedRequest.receipt_number && (
                    <Descriptions.Item label="Receipt Number">
                      <Text code>{selectedRequest.receipt_number}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Timeline */}
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>Timeline</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Timeline>
                <Timeline.Item color="blue">
                  <Text strong>Request Created</Text>
                  <br />
                  <Text type="secondary">{dayjs(selectedRequest.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                </Timeline.Item>
                {selectedRequest.verified_date && (
                  <Timeline.Item color="blue">
                    <Text strong>Request Verified</Text>
                    <br />
                    <Text type="secondary">{dayjs(selectedRequest.verified_date).format('DD/MM/YYYY HH:mm')}</Text>
                    <br />
                    <Text type="secondary">by {selectedRequest.verified_by_name}</Text>
                  </Timeline.Item>
                )}
                {selectedRequest.approved_date && (
                  <Timeline.Item color="green">
                    <Text strong>Request Approved</Text>
                    <br />
                    <Text type="secondary">{dayjs(selectedRequest.approved_date).format('DD/MM/YYYY HH:mm')}</Text>
                    <br />
                    <Text type="secondary">by {selectedRequest.approved_by_name}</Text>
                  </Timeline.Item>
                )}
                {selectedRequest.disbursed_date && (
                  <Timeline.Item color="purple">
                    <Text strong>Cash Disbursed</Text>
                    <br />
                    <Text type="secondary">{dayjs(selectedRequest.disbursed_date).format('DD/MM/YYYY HH:mm')}</Text>
                    <br />
                    <Text type="secondary">by {selectedRequest.disbursed_by_name}</Text>
                  </Timeline.Item>
                )}
                {selectedRequest.rejection_reason && (
                  <Timeline.Item color="red">
                    <Text strong>Request Rejected</Text>
                    <br />
                    <Text type="secondary">{selectedRequest.rejection_reason}</Text>
                  </Timeline.Item>
                )}
                {selectedRequest.updated_at !== selectedRequest.created_at && (
                  <Timeline.Item color="gray">
                    <Text strong>Last Updated</Text>
                    <br />
                    <Text type="secondary">{dayjs(selectedRequest.updated_at).format('DD/MM/YYYY HH:mm')}</Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>

            {/* Action Buttons */}
            {selectedRequest.status === 'pending' && (
              <div style={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                width: 750,
                padding: '16px 24px',
                background: '#fff',
                borderTop: '1px solid #f0f0f0',
                zIndex: 1000
              }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    danger
                    size="large"
                    icon={<CloseOutlined />}
                    onClick={() => handleReject()}
                  >
                    Reject Request
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={() => handleApprove()}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Approve Request
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
