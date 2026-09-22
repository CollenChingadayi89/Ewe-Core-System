import { useState, useEffect } from 'react';
import { Button, Avatar, Space, Row, Col, Modal, Form, Input, Select, DatePicker, InputNumber, message, Drawer, Descriptions, Timeline, Typography, Upload, Card, Tabs } from 'antd';
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
      const result = await createExpense({
        category: values.category,
        description: values.description,
        amount: values.amount,
        expense_date: values.expenseDate.format('YYYY-MM-DD'),
        justification: values.justification,
        priority: values.priority || 'medium',
        payment_method: values.paymentMethod,
        // receipt: values.receipt, // TODO: Handle file upload separately
      });

      if (result) {
        setRequestModalVisible(false);
        form.resetFields();
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
      render: (amount: number) => (
        <Text strong style={{ color: '#00d084', fontSize: '15px' }}>
          ZWG {amount.toLocaleString()}
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
        }}
        onOk={form.submit}
        width={700}
        okText="Submit Request"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitRequest}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Expense Category"
                name="category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category" size="large">
                  <Select.Option value="Meals & Entertainment">Meals & Entertainment</Select.Option>
                  <Select.Option value="Transportation">Transportation</Select.Option>
                  <Select.Option value="Office Supplies">Office Supplies</Select.Option>
                  <Select.Option value="Software & Tools">Software & Tools</Select.Option>
                  <Select.Option value="Training & Development">Training & Development</Select.Option>
                  <Select.Option value="Communication">Communication</Select.Option>
                  <Select.Option value="Utilities">Utilities</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
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
                  placeholder="Enter amount"
                  formatter={(value) => `ZWG ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/ZWG\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Expense Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="Brief description of the expense" size="large" />
          </Form.Item>

          <Form.Item
            label="Expense Date"
            name="expenseDate"
            rules={[{ required: true, message: 'Please select expense date' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Detailed Justification"
            name="justification"
            rules={[{ required: true, message: 'Please provide justification' }]}
          >
            <TextArea
              rows={4}
              placeholder="Provide detailed justification for this expense, including business purpose and context..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Upload Receipt/Invoice"
            name="receipt"
            rules={[{ required: true, message: 'Please upload receipt' }]}
          >
            <Upload
              maxCount={5}
              accept="image/*,.pdf"
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />} size="large">
                Click to Upload Receipt
              </Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              Accepted formats: PNG, JPG, PDF. Max 5 files.
            </Text>
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select placeholder="How did you pay for this?" size="large">
              <Select.Option value="Personal Card">Personal Credit/Debit Card</Select.Option>
              <Select.Option value="Cash">Cash</Select.Option>
              <Select.Option value="Mobile Money">Mobile Money</Select.Option>
              <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
            </Select>
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
                  ZWG {selectedRequest.amount.toLocaleString()}
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
