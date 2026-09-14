import { useState } from 'react';
import { Button, Avatar, Space, Row, Col, Modal, Form, Input, Select, DatePicker, InputNumber, message, Drawer, Descriptions, Timeline, Typography } from 'antd';
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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { mockPettyCashRequests } from '../../mock/dashboard';
import { useAuthStore } from '../../store/authStore';

const { TextArea } = Input;
const { Text } = Typography;

interface PettyCashRequest {
  id: string;
  purpose: string;
  requestedBy: string;
  department: string;
  amount: number;
  requestDate: string;
  status: string;
  avatar: string;
}

export const PettyCashPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PettyCashRequest | null>(null);
  const [form] = Form.useForm();

  // Calculate statistics
  const totalRequests = mockPettyCashRequests.length;
  const pendingAmount = mockPettyCashRequests
    .filter((r) => r.status === 'Pending')
    .reduce((sum, r) => sum + r.amount, 0);
  const disbursedAmount = mockPettyCashRequests
    .filter((r) => r.status === 'Disbursed')
    .reduce((sum, r) => sum + r.amount, 0);
  const reconciledAmount = mockPettyCashRequests
    .filter((r) => r.status === 'Reconciled')
    .reduce((sum, r) => sum + r.amount, 0);

  // Filter petty cash requests
  const filteredRequests = mockPettyCashRequests.filter((request) => {
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
      console.log('Petty cash request:', values);
      message.success('Petty cash request submitted successfully!');
      setRequestModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit request');
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
        title="Petty Cash Management"
        subtitle={`${filteredRequests.length} request${filteredRequests.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[{ title: 'Finance' }, { title: 'Petty Cash' }]}
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
            value={`ZWG ${pendingAmount.toLocaleString()}`}
            icon={<ClockCircleOutlined />}
            iconBg="rgba(255, 105, 0, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Disbursed"
            value={`ZWG ${disbursedAmount.toLocaleString()}`}
            icon={<WalletOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Reconciled"
            value={`ZWG ${reconciledAmount.toLocaleString()}`}
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
        }}
        onOk={form.submit}
        width={600}
        okText="Submit Request"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitRequest}>
          <Form.Item
            label="Purpose"
            name="purpose"
            rules={[{ required: true, message: 'Please enter purpose' }]}
          >
            <Input placeholder="Enter purpose of request" size="large" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category" size="large">
              <Select.Option value="Office Supplies">Office Supplies</Select.Option>
              <Select.Option value="Transportation">Transportation</Select.Option>
              <Select.Option value="Meals & Entertainment">Meals & Entertainment</Select.Option>
              <Select.Option value="Maintenance">Maintenance</Select.Option>
              <Select.Option value="Utilities">Utilities</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>

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

          <Form.Item
            label="Required Date"
            name="requiredDate"
            rules={[{ required: true, message: 'Please select required date' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea
              rows={4}
              placeholder="Provide detailed description of the expense..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="Supporting Documents" name="documents">
            <Button icon={<DownloadOutlined />}>Upload Documents</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Drawer */}
      <Drawer
        title="Petty Cash Request Details"
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
              <Descriptions.Item label="Purpose">{selectedRequest.purpose}</Descriptions.Item>
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
