import { useState } from 'react';
import { Button, Avatar, Space, Row, Col, Tag, Modal, Form, Input, Select, DatePicker, InputNumber, message, Drawer, Descriptions, Card, Typography, Table } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { mockProcurementRequests, procurementCategories, procurementStats } from '../../mock/procurement';
import type { ProcurementRequest } from '../../mock/procurement';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface Quotation {
  vendor: string;
  price: number;
  leadTime: string;
  notes: string;
}

export const ProcurementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [costRange, setCostRange] = useState<[number, number] | undefined>(undefined);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [form] = Form.useForm();

  // Filter procurement requests
  const filteredRequests = mockProcurementRequests.filter((request) => {
    const matchesSearch =
      request.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesCategory = !categoryFilter || request.category === categoryFilter;
    const matchesDepartment = !departmentFilter || request.department === departmentFilter;

    // Date range filter (using requested date)
    let matchesDate = true;
    if (dateRange && dateRange.length === 2) {
      const requestDate = new Date(request.requestedDate);
      const startDate = dateRange[0]?.toDate();
      const endDate = dateRange[1]?.toDate();
      matchesDate = requestDate >= startDate && requestDate <= endDate;
    }

    // Cost range filter
    let matchesCost = true;
    if (costRange) {
      matchesCost = request.estimatedCost >= costRange[0] && request.estimatedCost <= costRange[1];
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesDate && matchesCost;
  });

  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by item, requester, vendor, or ID...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 320,
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
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 150,
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Ordered', value: 'Ordered' },
        { label: 'Received', value: 'Received' },
        { label: 'Rejected', value: 'Rejected' },
      ],
    },
    {
      type: 'select',
      label: 'Category',
      placeholder: 'All Categories',
      onChange: setCategoryFilter,
      value: categoryFilter,
      width: 180,
      options: procurementCategories.map((cat) => ({ label: cat, value: cat })),
    },
    {
      type: 'select',
      label: 'Department',
      placeholder: 'All Departments',
      onChange: setDepartmentFilter,
      value: departmentFilter,
      width: 180,
      options: [
        { label: 'IT', value: 'IT' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Human Resources', value: 'Human Resources' },
        { label: 'Operations', value: 'Operations' },
        { label: 'Compliance & Risk', value: 'Compliance & Risk' },
      ],
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setCategoryFilter(undefined);
    setDepartmentFilter(undefined);
    setDateRange(undefined);
    setCostRange(undefined);
  };

  // Handle request submission
  const handleSubmitRequest = async (values: any) => {
    try {
      console.log('Procurement request:', values);
      message.success('Procurement request submitted successfully!');
      setRequestModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit request');
    }
  };

  // Handle view details
  const handleViewDetails = (request: ProcurementRequest) => {
    setSelectedRequest(request);
    setDetailsDrawerVisible(true);
  };

  // Mock quotations data
  const mockQuotations: Quotation[] = [
    { vendor: 'TechSupply Ltd', price: 45000, leadTime: '7 days', notes: 'Includes installation' },
    { vendor: 'Office Mart', price: 42500, leadTime: '10 days', notes: 'Bulk discount applied' },
    { vendor: 'Business Solutions', price: 48000, leadTime: '5 days', notes: 'Express delivery available' },
  ];

  // Priority badge color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return { bg: 'rgba(207, 46, 46, 0.1)', color: '#cf2e2e' };
      case 'High':
        return { bg: 'rgba(255, 105, 0, 0.1)', color: '#ff6900' };
      case 'Medium':
        return { bg: 'rgba(6, 147, 227, 0.1)', color: '#0693e3' };
      case 'Low':
        return { bg: 'rgba(0, 208, 132, 0.1)', color: '#00d084' };
      default:
        return { bg: 'rgba(140, 140, 140, 0.1)', color: '#8c8c8c' };
    }
  };

  // Table columns
  const columns: ColumnsType<ProcurementRequest> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
      render: (id: string) => (
        <span style={{ fontWeight: 600, color: '#0693e3', cursor: 'pointer' }}>
          {id}
        </span>
      ),
    },
    {
      title: 'Item/Description',
      dataIndex: 'itemDescription',
      key: 'itemDescription',
      width: 280,
      ellipsis: true,
      render: (desc: string, record: ProcurementRequest) => (
        <div>
          <div style={{ fontWeight: 500, color: '#32373c', marginBottom: '4px' }}>
            {desc}
          </div>
          <Tag
            style={{
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              border: 'none',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              color: '#0693e3',
              fontWeight: 500,
            }}
          >
            {record.category}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      width: 200,
      render: (name: string, record: ProcurementRequest) => (
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
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.department}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (qty: number, record: ProcurementRequest) => (
        <span style={{ color: '#595959', fontWeight: 500 }}>
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: 'Estimated Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 130,
      align: 'right',
      render: (cost: number) => (
        <span style={{ fontWeight: 600, color: '#32373c', fontSize: '13px' }}>
          ZWG {cost.toLocaleString()}
        </span>
      ),
      sorter: (a, b) => a.estimatedCost - b.estimatedCost,
    },
    {
      title: 'Requested Date',
      dataIndex: 'requestedDate',
      key: 'requestedDate',
      width: 120,
      render: (date: string) => (
        <span style={{ color: '#595959' }}>
          {new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime(),
    },
    {
      title: 'Required By',
      dataIndex: 'requiredByDate',
      key: 'requiredByDate',
      width: 120,
      render: (date: string) => {
        const reqDate = new Date(date);
        const today = new Date();
        const daysUntil = Math.ceil((reqDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysUntil <= 7 && daysUntil > 0;
        const isOverdue = daysUntil < 0;

        return (
          <div>
            <div style={{ color: isOverdue ? '#cf2e2e' : isUrgent ? '#ff6900' : '#595959' }}>
              {new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            {isOverdue && (
              <div style={{ fontSize: '11px', color: '#cf2e2e' }}>Overdue</div>
            )}
            {isUrgent && !isOverdue && (
              <div style={{ fontSize: '11px', color: '#ff6900' }}>{daysUntil} days</div>
            )}
          </div>
        );
      },
      sorter: (a, b) => new Date(a.requiredByDate).getTime() - new Date(b.requiredByDate).getTime(),
    },
    {
      title: 'Vendor/Supplier',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 180,
      ellipsis: true,
      render: (vendor?: string) => (
        <span style={{ color: vendor ? '#595959' : '#d9d9d9' }}>
          {vendor || 'Not assigned'}
        </span>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const { bg, color } = getPriorityColor(priority);
        return (
          <Tag
            style={{
              borderRadius: '6px',
              padding: '4px 10px',
              border: 'none',
              background: bg,
              color: color,
              fontWeight: 500,
            }}
          >
            {priority}
          </Tag>
        );
      },
      filters: [
        { text: 'Urgent', value: 'Urgent' },
        { text: 'High', value: 'High' },
        { text: 'Medium', value: 'Medium' },
        { text: 'Low', value: 'Low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusTag status={status} />,
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Ordered', value: 'Ordered' },
        { text: 'Received', value: 'Received' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record: ProcurementRequest) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            style={{ color: '#0693e3' }}
            title="View Details"
            onClick={() => handleViewDetails(record)}
          />
          {record.status === 'Pending' && (
            <>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#00d084' }}
                title="Approve"
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                style={{ color: '#cf2e2e' }}
                title="Reject"
              />
            </>
          )}
          {record.status === 'Approved' && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: '#9b51e0' }}
              title="Edit"
            />
          )}
        </Space>
      ),
    },
  ];

  // Calculate summary stats
  const totalEstimatedCost = filteredRequests.reduce((sum, req) => sum + req.estimatedCost, 0);
  const pendingCount = filteredRequests.filter((req) => req.status === 'Pending').length;
  const approvedCount = filteredRequests.filter((req) => req.status === 'Approved').length;
  const completedCount = filteredRequests.filter((req) => req.status === 'Received').length;
  const rejectedCount = filteredRequests.filter((req) => req.status === 'Rejected').length;

  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle="Manage procurement requests and purchase orders"
        breadcrumbs={[
          { title: 'Finance' },
          { title: 'Procurement' },
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
              onClick={() => setRequestModalVisible(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
              }}
            >
              New Procurement Request
            </Button>
          </>
        }
      />

      {/* Summary Statistics */}
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Total Requests"
              value={filteredRequests.length}
              icon={<FileTextOutlined />}
              iconBg="rgba(6, 147, 227, 0.1)"
              iconColor="#0693e3"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Pending Approval"
              value={pendingCount}
              icon={<ClockCircleOutlined />}
              iconBg="rgba(255, 105, 0, 0.1)"
              iconColor="#ff6900"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Approved"
              value={approvedCount}
              icon={<CheckCircleOutlined />}
              iconBg="rgba(0, 208, 132, 0.1)"
              iconColor="#00d084"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Completed"
              value={completedCount}
              icon={<InboxOutlined />}
              iconBg="rgba(155, 81, 224, 0.1)"
              iconColor="#9b51e0"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Rejected"
              value={rejectedCount}
              icon={<CloseOutlined />}
              iconBg="rgba(207, 46, 46, 0.1)"
              iconColor="#cf2e2e"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Total Est. Cost"
              value={totalEstimatedCost}
              prefix="KES "
              icon={<ShoppingCartOutlined />}
              cardBg="linear-gradient(135deg, #00d084 0%, #00BFA5 100%)"
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
        dataSource={filteredRequests}
        rowKey="id"
        scroll={{ x: 1800 }}
      />

      {/* Request Modal */}
      <Modal
        title="New Procurement Request"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        width={800}
        okText="Submit Request"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitRequest}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Item/Description"
                name="itemDescription"
                rules={[{ required: true, message: 'Please enter item description' }]}
              >
                <Input placeholder="Enter item description" size="large" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category" size="large">
                  {procurementCategories.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={1}
                  placeholder="Enter quantity"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Unit"
                name="unit"
                rules={[{ required: true, message: 'Please enter unit' }]}
              >
                <Input placeholder="e.g., pcs, boxes" size="large" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Estimated Cost (ZWG)"
                name="estimatedCost"
                rules={[{ required: true, message: 'Please enter estimated cost' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  step={100}
                  placeholder="Enter cost"
                  formatter={(value) => `ZWG ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/ZWG\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Required By Date"
                name="requiredByDate"
                rules={[{ required: true, message: 'Please select required by date' }]}
              >
                <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority" size="large">
                  <Select.Option value="Low">Low</Select.Option>
                  <Select.Option value="Medium">Medium</Select.Option>
                  <Select.Option value="High">High</Select.Option>
                  <Select.Option value="Urgent">Urgent</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Preferred Vendor/Supplier (Optional)"
            name="preferredVendor"
          >
            <Input placeholder="Enter preferred vendor if any" size="large" />
          </Form.Item>

          <Form.Item
            label="Justification/Purpose"
            name="justification"
            rules={[{ required: true, message: 'Please provide justification' }]}
          >
            <TextArea
              rows={4}
              placeholder="Provide detailed justification for this procurement request..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Additional Notes"
            name="notes"
          >
            <TextArea
              rows={2}
              placeholder="Any additional notes or special requirements..."
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Drawer with Quotations */}
      <Drawer
        title="Procurement Request Details"
        placement="right"
        width={700}
        onClose={() => setDetailsDrawerVisible(false)}
        open={detailsDrawerVisible}
      >
        {selectedRequest && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Request ID" span={2}>{selectedRequest.id}</Descriptions.Item>
              <Descriptions.Item label="Item/Description" span={2}>
                <Text strong>{selectedRequest.itemDescription}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selectedRequest.category}</Descriptions.Item>
              <Descriptions.Item label="Requested By">{selectedRequest.requestedBy}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedRequest.department}</Descriptions.Item>
              <Descriptions.Item label="Quantity">
                {selectedRequest.quantity} {selectedRequest.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Estimated Cost" span={2}>
                <Text strong style={{ color: '#00d084', fontSize: '16px' }}>
                  ZWG {selectedRequest.estimatedCost.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Requested Date">
                {new Date(selectedRequest.requestedDate).toLocaleDateString('en-GB')}
              </Descriptions.Item>
              <Descriptions.Item label="Required By">
                {new Date(selectedRequest.requiredByDate).toLocaleDateString('en-GB')}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag style={{
                  borderRadius: '6px',
                  padding: '4px 10px',
                  border: 'none',
                  background: getPriorityColor(selectedRequest.priority).bg,
                  color: getPriorityColor(selectedRequest.priority).color,
                  fontWeight: 500,
                }}>
                  {selectedRequest.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedRequest.status} />
              </Descriptions.Item>
              {selectedRequest.vendor && (
                <Descriptions.Item label="Vendor/Supplier" span={2}>
                  {selectedRequest.vendor}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Quotations Section */}
            <div style={{ marginTop: '24px' }}>
              <Title level={5}>
                <DollarOutlined /> Vendor Quotations
              </Title>
              <Card style={{ marginTop: '12px' }}>
                <Table
                  dataSource={mockQuotations}
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Vendor',
                      dataIndex: 'vendor',
                      key: 'vendor',
                      render: (vendor: string) => <Text strong>{vendor}</Text>,
                    },
                    {
                      title: 'Price',
                      dataIndex: 'price',
                      key: 'price',
                      render: (price: number) => (
                        <Text strong style={{ color: '#00d084' }}>
                          ZWG {price.toLocaleString()}
                        </Text>
                      ),
                      sorter: (a, b) => a.price - b.price,
                    },
                    {
                      title: 'Lead Time',
                      dataIndex: 'leadTime',
                      key: 'leadTime',
                    },
                    {
                      title: 'Notes',
                      dataIndex: 'notes',
                      key: 'notes',
                      ellipsis: true,
                    },
                    {
                      title: 'Action',
                      key: 'action',
                      render: () => (
                        <Button type="link" size="small">
                          Select
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>

            {selectedRequest.status === 'Pending' && (
              <div style={{ marginTop: '24px' }}>
                <Space style={{ width: '100%' }} direction="vertical">
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CheckOutlined />}
                    style={{ background: '#00d084', borderColor: '#00d084' }}
                  >
                    Approve Request
                  </Button>
                  <Button danger block size="large" icon={<CloseOutlined />}>
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
