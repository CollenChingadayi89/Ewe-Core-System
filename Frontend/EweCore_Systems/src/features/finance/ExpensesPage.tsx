import { useState, useEffect } from 'react';
import { Button, Avatar, Space, Row, Col, Modal, Form, Input, Select, DatePicker, InputNumber, message, Drawer, Descriptions, Timeline, Typography, Upload, Card, Tabs, Table } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  CloseOutlined,
  UploadOutlined,
  WalletOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore } from '../../store/expenseStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

interface ExpenseRequest {
  id: string;
  description: string;
  requestedBy: string;
  department: string;
  amount: number;
  currency: string;
  category: string;
  requestDate: string;
  status: string;
  avatar: string;
  receiptUrl?: string;
}

export const ExpensesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ZWG');
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  // Zustand store
  const {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    deleteExpense,
  } = useExpenseStore();

  // Fetch expenses on mount
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Map API expenses to component format
  const mapApiExpenseToComponent = (apiExpense: any): ExpenseRequest => ({
    id: apiExpense.expense_number || apiExpense.id,
    description: apiExpense.description,
    requestedBy: apiExpense.employee_name || 'Unknown',
    department: apiExpense.employee_department || 'N/A',
    amount: parseFloat(apiExpense.amount) || 0,
    currency: apiExpense.currency || 'ZWG',
    category: apiExpense.category_display || apiExpense.category || 'Other',
    requestDate: apiExpense.expense_date ? dayjs(apiExpense.expense_date).format('DD/MM/YYYY') : '',
    status: apiExpense.status_display || apiExpense.status || 'Pending',
    avatar: (apiExpense.employee_name || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase(),
    receiptUrl: apiExpense.receipt_url,
  });

  const mappedExpenses = expenses.map(mapApiExpenseToComponent);

  // Calculate statistics
  const totalRequests = mappedExpenses.length;
  const pendingAmount = mappedExpenses
    .filter((r) => r.status === 'Pending')
    .reduce((sum, r) => sum + r.amount, 0);
  const approvedAmount = mappedExpenses
    .filter((r) => r.status === 'Approved')
    .reduce((sum, r) => sum + r.amount, 0);
  const reimbursedAmount = mappedExpenses
    .filter((r) => r.status === 'Reimbursed' || r.status === 'Paid')
    .reduce((sum, r) => sum + r.amount, 0);

  // My expenses (for the logged-in user)
  const myExpenses = mappedExpenses.filter((req) => req.requestedBy === user?.name);

  // Filter expense requests based on active tab
  const getFilteredByTab = () => {
    if (activeTab === 'my-expenses') {
      return myExpenses;
    }
    return mappedExpenses;
  };

  // Apply search and filter
  const filteredRequests = getFilteredByTab().filter((request) => {
    const matchesSearch =
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesCategory = !categoryFilter || request.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Handle request submission
  const handleSubmitRequest = async (values: any) => {
    try {
      // Validate that if line items exist, the total matches
      // Only validate if there are actual line items with data (description AND amount > 0)
      const hasLineItems = values.line_items &&
                          values.line_items.length > 0 &&
                          values.line_items.some((item: any) =>
                            item.description &&
                            item.description.trim() !== '' &&
                            (parseFloat(item.amount) || 0) > 0
                          );

      if (hasLineItems) {
        const lineItemsTotal = values.line_items.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.amount) || 0);
        }, 0);

        // Round both values to 2 decimal places for comparison
        const roundedLineItemsTotal = Math.round(lineItemsTotal * 100) / 100;
        const roundedAmount = Math.round((values.amount || 0) * 100) / 100;

        if (Math.abs(roundedLineItemsTotal - roundedAmount) > 0.01) {
          message.error(`Total amount (${roundedAmount.toFixed(2)}) must match the sum of line items (${roundedLineItemsTotal.toFixed(2)})`);
          return;
        }
      }

      const result = await createExpense({
        employee: user.id, // Add employee ID from logged-in user
        category: values.category,
        description: values.description,
        amount: values.amount,
        currency: values.currency || 'ZWG',
        expense_date: values.expenseDate.format('YYYY-MM-DD'),
        notes: values.notes,
        priority: values.priority || 'medium',
        payment_method: values.paymentMethod,
        receipt_number: values.receiptNumber,
        status: 'pending',
        // line_items: values.line_items, // TODO: Add line_items to backend model
      }, values.receipt?.fileList); // Pass uploaded files

      if (result) {
        setRequestModalVisible(false);
        form.resetFields();
        setSelectedCurrency('ZWG');
      }
    } catch (error) {
      console.error('Failed to submit expense request:', error);
    }
  };

  // Handle view details
  const handleViewDetails = (request: ExpenseRequest) => {
    setSelectedRequest(request);
    setDetailsDrawerVisible(true);
  };

  // Handle approval
  const handleApprove = () => {
    message.success('Expense approved successfully');
    setDetailsDrawerVisible(false);
  };

  // Handle rejection
  const handleReject = () => {
    message.success('Expense rejected');
    setDetailsDrawerVisible(false);
  };

  // Filters configuration
  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by ID, description, or requester...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 300,
    },
    {
      type: 'select',
      label: 'Category',
      placeholder: 'All Categories',
      onChange: setCategoryFilter,
      value: categoryFilter,
      width: 200,
      options: [
        { label: 'Meals & Entertainment', value: 'Meals & Entertainment' },
        { label: 'Transportation', value: 'Transportation' },
        { label: 'Office Supplies', value: 'Office Supplies' },
        { label: 'Software & Tools', value: 'Software & Tools' },
        { label: 'Training & Development', value: 'Training & Development' },
        { label: 'Other', value: 'Other' },
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
        { label: 'Reimbursed', value: 'Reimbursed' },
        { label: 'Rejected', value: 'Rejected' },
      ],
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setCategoryFilter(undefined);
  };

  const columns: ColumnsType<ExpenseRequest> = [
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
      render: (name: string, record: ExpenseRequest) => (
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => (
        <Text style={{ fontSize: '13px', color: '#595959' }}>{category}</Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount: number, record: ExpenseRequest) => (
        <Text strong style={{ color: '#00d084', fontSize: '15px' }}>
          {record.currency || 'ZWG'} {amount.toLocaleString()}
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
        title="Expense Management"
        subtitle={`${filteredRequests.length} request${filteredRequests.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[{ title: 'Finance' }, { title: 'Expenses' }]}
        actions={
          <Space>
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
              Submit Expense
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
            value={`ZWG ${pendingAmount.toLocaleString()}`}
            icon={<ClockCircleOutlined />}
            iconBg="rgba(255, 105, 0, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Approved"
            value={`ZWG ${approvedAmount.toLocaleString()}`}
            icon={<DollarOutlined />}
            iconBg="rgba(59, 130, 246, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Reimbursed"
            value={`ZWG ${reimbursedAmount.toLocaleString()}`}
            icon={<WalletOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
          />
        </Col>
      </Row>

      {/* Tabs for All Expenses vs My Expenses */}
      <Card style={{ marginBottom: '20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: (
                <Space>
                  <FileProtectOutlined />
                  All Expenses
                </Space>
              ),
            },
            {
              key: 'my-expenses',
              label: (
                <Space>
                  <WalletOutlined />
                  My Reimbursements
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* Filters */}
      <FilterBar filters={filters} onSearch={setSearchTerm} onReset={handleReset} />

      {/* Expenses Table */}
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
        title="Submit Expense Reimbursement"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
          setSelectedCurrency('ZWG');
        }}
        onOk={form.submit}
        width={900}
        okText="Submit Request"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRequest}
          initialValues={{
            currency: 'ZWG',
            priority: 'medium',
            line_items: [],
          }}
        >
          {/* Row 1: Expense Date, Currency, Amount, Category */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Expense Date"
                name="expenseDate"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
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
                  <Select.Option value="travel">Travel</Select.Option>
                  <Select.Option value="accommodation">Accommodation</Select.Option>
                  <Select.Option value="meals">Meals & Entertainment</Select.Option>
                  <Select.Option value="transport">Transportation</Select.Option>
                  <Select.Option value="communication">Communication</Select.Option>
                  <Select.Option value="office_supplies">Office Supplies</Select.Option>
                  <Select.Option value="training">Training & Development</Select.Option>
                  <Select.Option value="professional_fees">Professional Fees</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: Description and Priority */}
          <Row gutter={16}>
            <Col span={18}>
              <Form.Item
                label="Expense Description"
                name="description"
                rules={[{ required: true, message: 'Please enter description' }]}
              >
                <Input placeholder="Brief description of the expense" />
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

          {/* Line Items Section */}
          <Card
            size="small"
            title="Line Items"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Optional: Itemize your expense for detailed tracking
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
                    onClick={() => add({ currency: selectedCurrency, quantity: 1, unit_price: 0, amount: 0 })}
                    icon={<PlusCircleOutlined />}
                    block
                    style={{ marginTop: fields.length > 0 ? 8 : 0 }}
                  >
                    Add Line Item
                  </Button>
                </>
              )}
            </Form.List>
          </Card>

          {/* Notes Section */}
          <Form.Item
            label="Additional Notes"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="Provide any additional notes, justification, or context for this expense..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Receipt Upload Section */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Receipt Number (Optional)"
                name="receiptNumber"
              >
                <Input placeholder="Enter receipt/invoice number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Payment Method"
                name="paymentMethod"
                rules={[{ required: true, message: 'Please select payment method' }]}
              >
                <Select placeholder="How did you pay for this?">
                  <Select.Option value="Personal Card">Personal Credit/Debit Card</Select.Option>
                  <Select.Option value="Cash">Cash</Select.Option>
                  <Select.Option value="Mobile Money">Mobile Money</Select.Option>
                  <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Upload Receipt/Invoice"
            name="receipt"
          >
            <Upload
              maxCount={5}
              accept="image/*,.pdf"
              beforeUpload={() => false}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>
                Click to Upload Receipt
              </Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              Accepted formats: PNG, JPG, PDF. Max 5 files.
            </Text>
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Drawer */}
      <Drawer
        title="Expense Request Details"
        placement="right"
        width={600}
        onClose={() => setDetailsDrawerVisible(false)}
        open={detailsDrawerVisible}
      >
        {selectedRequest && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Request ID">{selectedRequest.id}</Descriptions.Item>
              <Descriptions.Item label="Requested By">{selectedRequest.requestedBy}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedRequest.department}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedRequest.category}</Descriptions.Item>
              <Descriptions.Item label="Description">{selectedRequest.description}</Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong style={{ color: '#00d084', fontSize: '16px' }}>
                  {selectedRequest.currency || 'ZWG'} {selectedRequest.amount.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Request Date">{selectedRequest.requestDate}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedRequest.status} />
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px' }}>
              <Text strong>Receipt/Invoice</Text>
              <Card style={{ marginTop: '12px', background: '#f5f5f5' }}>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <FileProtectOutlined style={{ fontSize: '48px', color: '#00d084' }} />
                  <Text>Receipt_001.pdf</Text>
                  <Button type="link" icon={<DownloadOutlined />}>
                    Download Receipt
                  </Button>
                </Space>
              </Card>
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
                     selectedRequest.status === 'Reimbursed' ? 'Amount reimbursed' : 'Request rejected'}
                  </Timeline.Item>
                )}
              </Timeline>
            </div>

            {selectedRequest.status === 'Pending' && (
              <div style={{ marginTop: '24px' }}>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove()}
                  style={{ background: '#00d084', borderColor: '#00d084', marginBottom: '8px' }}
                >
                  Approve Request
                </Button>
                <Button danger block size="large" icon={<CloseOutlined />} onClick={() => handleReject()}>
                  Reject Request
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
