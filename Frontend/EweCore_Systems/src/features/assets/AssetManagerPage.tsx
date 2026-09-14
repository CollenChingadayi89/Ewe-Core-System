import { useState } from 'react';
import { Button, Avatar, Space, Tag, Row, Col, Modal, Form, Input, Select, DatePicker, InputNumber, message, Drawer, Descriptions, Typography, Timeline } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  SwapOutlined,
  RollbackOutlined,
  LaptopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { mockAssets, assetCategories, assetStatuses, assetStats, assignableEmployees } from '../../mock/assets';
import type { Asset } from '../../mock/assets';

const { TextArea } = Input;
const { Text } = Typography;

export const AssetManagerPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [assignedToFilter, setAssignedToFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [addAssetModalVisible, setAddAssetModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [returnForm] = Form.useForm();

  // Filter assets
  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || asset.category === categoryFilter;
    const matchesStatus = !statusFilter || asset.status === statusFilter;
    const matchesAssignedTo = !assignedToFilter || asset.assignedToId === assignedToFilter;

    // Simple date range filter for purchase date
    let matchesDate = true;
    if (dateRange && dateRange.length === 2) {
      const purchaseDate = new Date(asset.purchaseDate);
      const startDate = dateRange[0]?.toDate();
      const endDate = dateRange[1]?.toDate();
      matchesDate = purchaseDate >= startDate && purchaseDate <= endDate;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesAssignedTo && matchesDate;
  });

  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by asset name, ID, employee, or serial...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 320,
    },
    {
      type: 'select',
      label: 'Category',
      placeholder: 'All Categories',
      onChange: setCategoryFilter,
      value: categoryFilter,
      width: 180,
      options: assetCategories.map((cat) => ({ label: cat, value: cat })),
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 160,
      options: assetStatuses.map((status) => ({ label: status, value: status })),
    },
    {
      type: 'select',
      label: 'Assigned To',
      placeholder: 'All Employees',
      onChange: setAssignedToFilter,
      value: assignedToFilter,
      width: 200,
      options: assignableEmployees.map((emp) => ({
        label: `${emp.name} (${emp.department})`,
        value: emp.id
      })),
    },
    {
      type: 'dateRange',
      label: 'Purchase Date',
      onChange: setDateRange,
      value: dateRange,
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter(undefined);
    setStatusFilter(undefined);
    setAssignedToFilter(undefined);
    setDateRange(undefined);
  };

  // Handle add asset
  const handleAddAsset = async (values: any) => {
    try {
      console.log('New asset:', values);
      message.success('Asset added successfully!');
      setAddAssetModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to add asset');
    }
  };

  // Handle assign asset
  const handleAssignAsset = async (values: any) => {
    try {
      console.log('Assign asset:', values);
      message.success('Asset assigned successfully!');
      setAssignModalVisible(false);
      assignForm.resetFields();
    } catch (error) {
      message.error('Failed to assign asset');
    }
  };

  // Handle return asset
  const handleReturnAsset = async (values: any) => {
    try {
      console.log('Return asset:', values);
      message.success('Asset return request submitted for approval!');
      setReturnModalVisible(false);
      returnForm.resetFields();
    } catch (error) {
      message.error('Failed to submit return request');
    }
  };

  // Handle view details
  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailsDrawerVisible(true);
  };

  // Open assign modal
  const openAssignModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssignModalVisible(true);
  };

  // Open return modal
  const openReturnModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setReturnModalVisible(true);
  };

  // Table columns matching the Assets.png design
  const columns: ColumnsType<Asset> = [
    {
      title: 'Asset ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
      render: (id: string) => (
        <span style={{ fontWeight: 600, color: '#32373c' }}>{id}</span>
      ),
    },
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string) => (
        <span style={{ fontWeight: 500, color: '#32373c' }}>{name}</span>
      ),
    },
    {
      title: 'Asset User',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 200,
      render: (name: string, record: Asset) => {
        if (name === 'General Use' || name === 'IT Department' || name === 'Human Resources') {
          return (
            <Tag
              style={{
                borderRadius: '6px',
                padding: '4px 12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                color: '#0693e3',
                fontWeight: 500,
              }}
            >
              {name}
            </Tag>
          );
        }
        return (
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
            <span style={{ fontWeight: 500, color: '#32373c' }}>{name}</span>
          </div>
        );
      },
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 130,
      render: (date: string) => (
        <span style={{ color: '#595959' }}>
          {new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime(),
    },
    {
      title: 'Warranty',
      dataIndex: 'warranty',
      key: 'warranty',
      width: 110,
      render: (warranty: string) => (
        <span style={{ fontSize: '12px', color: '#595959' }}>{warranty}</span>
      ),
    },
    {
      title: 'Warranty End Date',
      dataIndex: 'warrantyEndDate',
      key: 'warrantyEndDate',
      width: 140,
      render: (date: string) => {
        const endDate = new Date(date);
        const today = new Date();
        const isExpired = endDate < today;

        return (
          <span style={{ color: isExpired ? '#cf2e2e' : '#595959', fontWeight: isExpired ? 500 : 400 }}>
            {endDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        );
      },
      sorter: (a, b) => new Date(a.warrantyEndDate).getTime() - new Date(b.warrantyEndDate).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusTag status={status} />,
      filters: assetStatuses.map(status => ({ text: status, value: status })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record: Asset) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            style={{ color: '#0693e3' }}
            title="View Details"
            onClick={() => handleViewDetails(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<SwapOutlined />}
            style={{ color: '#00d084' }}
            title="Assign Asset"
            onClick={() => openAssignModal(record)}
          />
          {record.status === 'Active' && !record.assignedTo.includes('General') && (
            <Button
              type="text"
              size="small"
              icon={<RollbackOutlined />}
              style={{ color: '#ff6900' }}
              title="Return Asset"
              onClick={() => openReturnModal(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  // Calculate summary stats
  const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.value, 0);
  const currentValue = filteredAssets.reduce((sum, asset) => sum + (asset.currentValue || asset.value), 0);

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle={`${filteredAssets.length} asset${filteredAssets.length !== 1 ? 's' : ''} • Total Value: ZWG ${totalValue.toLocaleString()} • Current Value: ZWG ${currentValue.toLocaleString()}`}
        breadcrumbs={[
          { title: 'Administration' },
          { title: 'Assets' },
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
              onClick={() => setAddAssetModalVisible(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff6900 0%, #ff8534 100%)',
                border: 'none',
              }}
            >
              Add New Asset
            </Button>
          </>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Assets"
            value={assetStats.total}
            icon={<LaptopOutlined />}
            iconBg="rgba(6, 147, 227, 0.1)"
            style={{ height: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Assets"
            value={assetStats.active}
            icon={<CheckCircleOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
            style={{ height: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Under Maintenance"
            value={assetStats.underMaintenance}
            icon={<ToolOutlined />}
            iconBg="rgba(255, 105, 0, 0.1)"
            style={{ height: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Value"
            value={assetStats.totalValue.toLocaleString()}
            prefix="ZWG"
            icon={<CheckCircleOutlined />}
            cardBg="linear-gradient(135deg, #00d084 0%, #00BFA5 100%)"
            style={{ height: '100%' }}
          />
        </Col>
      </Row>

      {/* Assets List Section */}
      <div
        style={{
          background: 'white',
          padding: '20px 24px 8px',
          borderRadius: '12px 12px 0 0',
          marginBottom: '-20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#32373c',
            marginBottom: '16px',
          }}
        >
          Assets List
        </div>
      </div>

      <FilterBar
        filters={filters}
        onSearch={setSearchTerm}
        onReset={handleReset}
      />

      <DataTable
        columns={columns}
        dataSource={filteredAssets}
        rowKey="id"
        scroll={{ x: 1400 }}
      />

      {/* Add Asset Modal */}
      <Modal
        title="Add New Asset"
        open={addAssetModalVisible}
        onCancel={() => {
          setAddAssetModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        width={800}
        okText="Add Asset"
      >
        <Form form={form} layout="vertical" onFinish={handleAddAsset}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Asset Name"
                name="name"
                rules={[{ required: true, message: 'Please enter asset name' }]}
              >
                <Input placeholder="e.g., Dell Laptop XPS 15" size="large" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category" size="large">
                  {assetCategories.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Serial Number"
                name="serialNumber"
                rules={[{ required: true, message: 'Please enter serial number' }]}
              >
                <Input placeholder="Enter serial number" size="large" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Model"
                name="model"
              >
                <Input placeholder="Enter model" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Purchase Date"
                name="purchaseDate"
                rules={[{ required: true, message: 'Please select purchase date' }]}
              >
                <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Purchase Value (ZWG)"
                name="value"
                rules={[{ required: true, message: 'Please enter value' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  step={1000}
                  placeholder="Enter value"
                  formatter={(value) => `ZWG ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/ZWG\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Warranty (months)"
                name="warranty"
                rules={[{ required: true, message: 'Please enter warranty period' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  max={120}
                  placeholder="e.g., 12"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Vendor/Supplier"
                name="vendor"
              >
                <Input placeholder="Enter vendor name" size="large" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status" size="large">
                  {assetStatuses.map((status) => (
                    <Select.Option key={status} value={status}>
                      {status}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Location"
            name="location"
          >
            <Input placeholder="Physical location of asset" size="large" />
          </Form.Item>

          <Form.Item
            label="Additional Notes"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="Any additional information about this asset..."
              maxLength={300}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Asset Modal */}
      <Modal
        title={`Assign Asset: ${selectedAsset?.name || ''}`}
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          assignForm.resetFields();
        }}
        onOk={assignForm.submit}
        width={500}
        okText="Assign Asset"
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignAsset}>
          <Form.Item
            label="Assign To"
            name="assignTo"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select
              placeholder="Select employee"
              size="large"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={assignableEmployees.map((emp) => ({
                label: `${emp.name} (${emp.department})`,
                value: emp.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Assignment Date"
            name="assignmentDate"
            rules={[{ required: true, message: 'Please select assignment date' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Purpose/Reason"
            name="purpose"
            rules={[{ required: true, message: 'Please enter purpose' }]}
          >
            <TextArea
              rows={3}
              placeholder="Reason for this assignment..."
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Return Asset Modal */}
      <Modal
        title={`Return Asset: ${selectedAsset?.name || ''}`}
        open={returnModalVisible}
        onCancel={() => {
          setReturnModalVisible(false);
          returnForm.resetFields();
        }}
        onOk={returnForm.submit}
        width={500}
        okText="Submit Return Request"
      >
        <Form form={returnForm} layout="vertical" onFinish={handleReturnAsset}>
          <Form.Item
            label="Return Date"
            name="returnDate"
            rules={[{ required: true, message: 'Please select return date' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Asset Condition"
            name="condition"
            rules={[{ required: true, message: 'Please select condition' }]}
          >
            <Select placeholder="Select condition" size="large">
              <Select.Option value="Excellent">Excellent</Select.Option>
              <Select.Option value="Good">Good</Select.Option>
              <Select.Option value="Fair">Fair</Select.Option>
              <Select.Option value="Poor">Poor - Requires Repair</Select.Option>
              <Select.Option value="Damaged">Damaged - Not Functional</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Reason for Return"
            name="reason"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <TextArea
              rows={3}
              placeholder="Why is this asset being returned?"
              maxLength={300}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Additional Comments"
            name="comments"
          >
            <TextArea
              rows={2}
              placeholder="Any issues, damages, or other notes..."
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Asset Details Drawer */}
      <Drawer
        title="Asset Details"
        placement="right"
        width={600}
        onClose={() => setDetailsDrawerVisible(false)}
        open={detailsDrawerVisible}
      >
        {selectedAsset && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Asset ID" span={2}>{selectedAsset.id}</Descriptions.Item>
              <Descriptions.Item label="Asset Name" span={2}>
                <Text strong>{selectedAsset.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selectedAsset.category}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedAsset.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Serial Number" span={2}>
                {selectedAsset.serialNumber || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Date">
                {new Date(selectedAsset.purchaseDate).toLocaleDateString('en-GB')}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Value">
                <Text strong style={{ color: '#00d084' }}>
                  ZWG {selectedAsset.value.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Current Value">
                <Text strong>
                  ZWG {(selectedAsset.currentValue || selectedAsset.value).toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Warranty">
                {selectedAsset.warranty}
              </Descriptions.Item>
              <Descriptions.Item label="Warranty End" span={2}>
                {new Date(selectedAsset.warrantyEndDate).toLocaleDateString('en-GB')}
              </Descriptions.Item>
              <Descriptions.Item label="Currently Assigned To" span={2}>
                <Space>
                  <UserOutlined />
                  <Text strong>{selectedAsset.assignedTo}</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {/* Assignment History */}
            <div style={{ marginTop: '24px' }}>
              <Text strong>Assignment History</Text>
              <Timeline style={{ marginTop: '16px' }}>
                <Timeline.Item color="green">
                  Asset purchased - {new Date(selectedAsset.purchaseDate).toLocaleDateString('en-GB')}
                </Timeline.Item>
                <Timeline.Item color="blue">
                  Assigned to {selectedAsset.assignedTo} - 15/08/2026
                </Timeline.Item>
                {selectedAsset.status === 'Under Maintenance' && (
                  <Timeline.Item color="orange">
                    Sent for maintenance - Current
                  </Timeline.Item>
                )}
              </Timeline>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '24px' }}>
              <Space style={{ width: '100%' }} direction="vertical">
                <Button
                  block
                  size="large"
                  icon={<SwapOutlined />}
                  onClick={() => {
                    setDetailsDrawerVisible(false);
                    openAssignModal(selectedAsset);
                  }}
                >
                  Reassign Asset
                </Button>
                {!selectedAsset.assignedTo.includes('General') && (
                  <Button
                    block
                    size="large"
                    icon={<RollbackOutlined />}
                    onClick={() => {
                      setDetailsDrawerVisible(false);
                      openReturnModal(selectedAsset);
                    }}
                  >
                    Return Asset
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
