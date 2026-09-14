import { useState } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Input, Select, message, Space, Typography, Tag } from 'antd';
import {
  LaptopOutlined,
  PlusOutlined,
  EyeOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, StatCard, StatusTag } from '../../components/common';
import { useAuthStore } from '../../store/authStore';

const { TextArea } = Input;
const { Text } = Typography;

interface Asset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  assignedDate: string;
  condition: string;
  status: 'in-use' | 'returned' | 'maintenance';
}

interface AssetRequest {
  id: string;
  assetType: string;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const MyAssetsPage = () => {
  const { user } = useAuthStore();
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [form] = Form.useForm();

  // Mock assigned assets
  const mockAssets: Asset[] = [
    {
      id: 'ASSET-001',
      name: 'Dell Latitude 5520',
      category: 'Laptop',
      serialNumber: 'DL-2026-001',
      assignedDate: '15/01/2026',
      condition: 'Good',
      status: 'in-use',
    },
    {
      id: 'ASSET-002',
      name: 'HP Monitor 24"',
      category: 'Monitor',
      serialNumber: 'HP-MON-145',
      assignedDate: '15/01/2026',
      condition: 'Excellent',
      status: 'in-use',
    },
    {
      id: 'ASSET-003',
      name: 'Logitech Keyboard',
      category: 'Accessory',
      serialNumber: 'LG-KB-789',
      assignedDate: '15/01/2026',
      condition: 'Good',
      status: 'in-use',
    },
  ];

  // Mock asset requests
  const mockRequests: AssetRequest[] = [
    {
      id: 'REQ-001',
      assetType: 'Wireless Mouse',
      reason: 'Current mouse is not working properly',
      requestDate: '05/09/2026',
      status: 'pending',
    },
    {
      id: 'REQ-002',
      assetType: 'Headset',
      reason: 'For daily meetings and calls',
      requestDate: '01/09/2026',
      status: 'approved',
    },
  ];

  // Calculate statistics
  const stats = {
    assigned: mockAssets.filter(a => a.status === 'in-use').length,
    returned: mockAssets.filter(a => a.status === 'returned').length,
    maintenance: mockAssets.filter(a => a.status === 'maintenance').length,
    requestsPending: mockRequests.filter(r => r.status === 'pending').length,
  };

  const handleSubmitRequest = async (values: any) => {
    try {
      // Mock submission
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('Asset request submitted successfully!');
      setRequestModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit request');
    }
  };

  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailsModalVisible(true);
  };

  // Assets table columns
  const assetColumns: ColumnsType<Asset> = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Asset) => (
        <Space>
          <LaptopOutlined style={{ color: '#00d084' }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Serial Number',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assignedDate',
      key: 'assignedDate',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string) => {
        const color = condition === 'Excellent' ? 'green' :
                     condition === 'Good' ? 'blue' : 'orange';
        return <Tag color={color}>{condition}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Asset) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View
        </Button>
      ),
    },
  ];

  // Requests table columns
  const requestColumns: ColumnsType<AssetRequest> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text strong>{id}</Text>,
    },
    {
      title: 'Asset Type',
      dataIndex: 'assetType',
      key: 'assetType',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Assets"
        subtitle="View your assigned assets and request new ones"
        breadcrumbs={[
          { title: 'Employee' },
          { title: 'My Assets' },
        ]}
        actions={
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
            Request Asset
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Assigned Assets"
            value={stats.assigned}
            icon={<LaptopOutlined />}
            iconBg="#667eea"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Returned"
            value={stats.returned}
            icon={<CheckCircleOutlined />}
            iconBg="#00d084"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="In Maintenance"
            value={stats.maintenance}
            icon={<ToolOutlined />}
            iconBg="#ff6900"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Requests"
            value={stats.requestsPending}
            icon={<ClockCircleOutlined />}
            iconBg="#4facfe"
          />
        </Col>
      </Row>

      {/* Assigned Assets Table */}
      <Card
        title="My Assigned Assets"
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Table
          columns={assetColumns}
          dataSource={mockAssets}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Asset Requests Table */}
      <Card
        title="My Asset Requests"
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Table
          columns={requestColumns}
          dataSource={mockRequests}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Request Asset Modal */}
      <Modal
        title="Request New Asset"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRequest}
        >
          <Form.Item
            label="Asset Type"
            name="assetType"
            rules={[{ required: true, message: 'Please select asset type' }]}
          >
            <Select size="large" placeholder="Select asset type">
              <Select.Option value="Laptop">Laptop</Select.Option>
              <Select.Option value="Monitor">Monitor</Select.Option>
              <Select.Option value="Keyboard">Keyboard</Select.Option>
              <Select.Option value="Mouse">Mouse</Select.Option>
              <Select.Option value="Headset">Headset</Select.Option>
              <Select.Option value="Webcam">Webcam</Select.Option>
              <Select.Option value="Docking Station">Docking Station</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Reason for Request"
            name="reason"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <TextArea
              rows={4}
              placeholder="Explain why you need this asset..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Additional Details"
            name="details"
          >
            <TextArea
              rows={2}
              placeholder="Any specific requirements or details..."
              maxLength={200}
              showCount
            />
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

      {/* Asset Details Modal */}
      <Modal
        title="Asset Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedAsset && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text type="secondary">Asset ID</Text>
              <div>
                <Text strong style={{ fontSize: '16px' }}>{selectedAsset.id}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Asset Name</Text>
              <div>
                <Space>
                  <LaptopOutlined style={{ fontSize: '20px', color: '#00d084' }} />
                  <Text strong style={{ fontSize: '16px' }}>{selectedAsset.name}</Text>
                </Space>
              </div>
            </div>

            <div>
              <Text type="secondary">Category</Text>
              <div>
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {selectedAsset.category}
                </Tag>
              </div>
            </div>

            <div>
              <Text type="secondary">Serial Number</Text>
              <div>
                <Text>{selectedAsset.serialNumber}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Assigned Date</Text>
              <div>
                <Text>{selectedAsset.assignedDate}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Condition</Text>
              <div>
                <Tag color={selectedAsset.condition === 'Excellent' ? 'green' : 'blue'}>
                  {selectedAsset.condition}
                </Tag>
              </div>
            </div>

            <div>
              <Text type="secondary">Status</Text>
              <div>
                <StatusTag status={selectedAsset.status} />
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};
