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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { usePettyCashStore } from '../../store/pettyCashStore';
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
  const [selectedRequest, setSelectedRequest] = useState<PettyCashRequest | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ZWG');

  // Zustand store
  const {
    pettyCashRequests,
    loading,
    error,
    fetchRequests,
    createRequest,
    deleteRequest,
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
      // Extract files from fileList
      const files = fileList.map(file => file.originFileObj as File).filter(Boolean);

      const result = await createRequest({
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
        line_items: values.line_items || [],
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
  const handleViewDetails = (request: PettyCashRequest) => {
    setSelectedRequest(request);
    setDetailsDrawerVisible(true);
  };

  // Handle approval
  const handleApprove = () => {
    message.success('Request approved successfully');
    setDetailsDrawerVisible(false);
  };

  // Handle rejection
  const handleReject = () => {
    message.success('Request rejected');
    setDetailsDrawerVisible(false);
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
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
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
          {/* Basic Information - 3 Column Layout */}
          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={8}>
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
            <Col span={8}>
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

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="Purpose"
                name="purpose"
                rules={[{ required: true, message: 'Please enter purpose' }]}
              >
                <Input placeholder="Brief purpose of request" />
              </Form.Item>
            </Col>
            <Col span={8}>
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
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  placeholder="Enter amount"
                  formatter={(value) => `${selectedCurrency} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/[A-Z]+\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>

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
                          width: '35%',
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
                          title: 'Quantity',
                          key: 'quantity',
                          width: '15%',
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
                              />
                            </Form.Item>
                          ),
                        },
                        {
                          title: 'Unit Price',
                          key: 'unit_price',
                          width: '20%',
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
                              />
                            </Form.Item>
                          ),
                        },
                        {
                          title: 'Total',
                          key: 'amount',
                          width: '20%',
                          render: (_, field) => (
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) => {
                                const quantity = getFieldValue(['line_items', field.name, 'quantity']) || 0;
                                const unitPrice = getFieldValue(['line_items', field.name, 'unit_price']) || 0;
                                const calculatedAmount = quantity * unitPrice;

                                // Auto-set the amount field
                                form.setFieldValue(['line_items', field.name, 'amount'], calculatedAmount);

                                return (
                                  <Text strong style={{ fontSize: 14 }}>
                                    {selectedCurrency} {calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              onClick={() => remove(field.name)}
                              size="small"
                            />
                          ),
                        },
                      ]}
                    />
                  )}

                  <Button
                    type="dashed"
                    onClick={() => add({ description: '', quantity: 1, unit_price: 0, amount: 0 })}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: fields.length > 0 ? 8 : 0 }}
                  >
                    Add Line Item
                  </Button>

                  {/* Grand Total Display */}
                  {fields.length > 0 && (
                    <Form.Item noStyle shouldUpdate>
                      {({ getFieldValue }) => {
                        const lineItems = getFieldValue('line_items') || [];
                        const grandTotal = lineItems.reduce((sum: number, item: any) => {
                          const qty = parseFloat(item?.quantity || 0);
                          const price = parseFloat(item?.unit_price || 0);
                          return sum + (qty * price);
                        }, 0);

                        // Auto-update the main amount field
                        form.setFieldValue('amount', grandTotal);

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
                              {selectedCurrency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        title="Petty Cash Request Details"
        placement="right"
        width={650}
        onClose={() => setDetailsDrawerVisible(false)}
        open={detailsDrawerVisible}
      >
        {selectedRequest && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Request ID">
                <Text strong style={{ color: '#0693e3' }}>{selectedRequest.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Requested By">{selectedRequest.requestedBy}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedRequest.department}</Descriptions.Item>
              <Descriptions.Item label="Request Date">{selectedRequest.requestDate}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedRequest.status} />
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '20px' }}>
              <Text strong style={{ fontSize: '14px' }}>Financial Details</Text>
              <Descriptions column={1} bordered size="small" style={{ marginTop: '12px' }}>
                <Descriptions.Item label="Amount">
                  <Text strong style={{ color: '#00d084', fontSize: '16px' }}>
                    {selectedRequest.currency} {selectedRequest.amount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Currency">{selectedRequest.currency}</Descriptions.Item>
                {selectedRequest.accountCode && (
                  <Descriptions.Item label="Account/GL Code">{selectedRequest.accountCode}</Descriptions.Item>
                )}
                <Descriptions.Item label="Receipt Expected">
                  {selectedRequest.receiptExpected ? 'Yes' : 'No'}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div style={{ marginTop: '20px' }}>
              <Text strong style={{ fontSize: '14px' }}>Request Details</Text>
              <Descriptions column={1} bordered size="small" style={{ marginTop: '12px' }}>
                <Descriptions.Item label="Purpose">{selectedRequest.purpose}</Descriptions.Item>
                {selectedRequest.justification && (
                  <Descriptions.Item label="Justification">
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.justification}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>

            <div style={{ marginTop: '24px' }}>
              <Text strong>Request Timeline</Text>
              <Timeline style={{ marginTop: '16px' }}>
                <Timeline.Item color="green">
                  Request submitted - {selectedRequest.requestDate}
                </Timeline.Item>
                {selectedRequest.status !== 'Pending' && (
                  <Timeline.Item color={selectedRequest.status === 'Rejected' ? 'red' : 'blue'}>
                    {selectedRequest.status === 'Approved' ? 'Request approved' :
                     selectedRequest.status === 'Disbursed' ? 'Cash disbursed' :
                     selectedRequest.status === 'Reconciled' ? 'Amount reconciled' : 'Request rejected'}
                  </Timeline.Item>
                )}
              </Timeline>
            </div>

            {selectedRequest.status === 'Pending' && (
              <div style={{ marginTop: '24px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={() => handleApprove()}
                    style={{ background: '#00d084', borderColor: '#00d084' }}
                  >
                    Approve Request
                  </Button>
                  <Button danger block size="large" icon={<CloseOutlined />} onClick={() => handleReject()}>
                    Reject Request
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
