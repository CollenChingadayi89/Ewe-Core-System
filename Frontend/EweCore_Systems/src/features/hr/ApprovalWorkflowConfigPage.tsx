/**
 * Approval Workflow Configuration Page
 *
 * Configure department-based approval workflows for leave requests
 * - Multiple approval stages per department
 * - Multiple positions per stage for redundancy (when one approver is unavailable)
 * - Any position in a stage can approve to move to next stage
 */

import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Drawer,
  Alert,
  Divider,
  Tooltip,
  message,
  Steps,
  List,
  Typography,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  ApartmentOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Position that can approve at a stage
 * Multiple positions can be added to each stage for redundancy
 */
interface ApproverPosition {
  id: string;
  positionTitle: string; // e.g., "HR Manager", "Department Manager", "CEO"
  departmentId?: string; // If position is department-specific
  isRequired: boolean; // If true, this specific position must approve
}

/**
 * Enhanced approval stage with multiple positions
 */
interface WorkflowStage {
  id: string;
  order: number;
  stageName: string; // e.g., "Department Manager Approval", "HR Review"
  approverPositions: ApproverPosition[]; // Multiple positions that can approve
  approvalLogic: 'any' | 'all'; // 'any' = any position can approve, 'all' = all positions must approve
  isMandatory: boolean;
  autoEscalateAfterDays: number;
  escalateTo?: string; // Position title to escalate to
  allowDelegation: boolean;
  notifyAllPositions: boolean; // If true, all positions get notified even if 'any' logic
}

/**
 * Department-specific approval workflow
 */
interface DepartmentWorkflow {
  id: string;
  departmentId: string;
  departmentName: string;
  leaveType: string; // 'annual', 'sick', etc., or 'all' for default
  stages: WorkflowStage[];
  isActive: boolean;
  isDefault: boolean; // If true, applies to departments without specific workflow
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockDepartments = [
  { id: 'DEPT-001', name: 'All Departments (Default)' },
  { id: 'DEPT-002', name: 'Human Resources' },
  { id: 'DEPT-003', name: 'Finance' },
  { id: 'DEPT-004', name: 'Information Technology' },
  { id: 'DEPT-005', name: 'Operations' },
  { id: 'DEPT-006', name: 'Marketing' },
];

const mockPositions = [
  'Department Manager',
  'Senior Manager',
  'HR Manager',
  'Finance Manager',
  'CEO',
  'Deputy CEO',
  'Chief Operations Officer',
  'Division Head',
  'Team Lead',
  'HR Officer',
  'Finance Officer',
];

const mockLeaveTypes = [
  { value: 'all', label: 'All Leave Types (Default)' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'special', label: 'Special Leave' },
  { value: 'study', label: 'Study Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

const mockWorkflows: DepartmentWorkflow[] = [
  {
    id: 'WF-001',
    departmentId: 'DEPT-001',
    departmentName: 'All Departments (Default)',
    leaveType: 'all',
    isDefault: true,
    isActive: true,
    description: 'Default approval workflow applied to all departments without specific configuration',
    stages: [
      {
        id: 'STAGE-001',
        order: 1,
        stageName: 'Line Manager Approval',
        approverPositions: [
          {
            id: 'POS-001',
            positionTitle: 'Department Manager',
            isRequired: false,
          },
          {
            id: 'POS-002',
            positionTitle: 'Team Lead',
            isRequired: false,
          },
        ],
        approvalLogic: 'any',
        isMandatory: true,
        autoEscalateAfterDays: 3,
        escalateTo: 'Senior Manager',
        allowDelegation: true,
        notifyAllPositions: true,
      },
      {
        id: 'STAGE-002',
        order: 2,
        stageName: 'HR Review',
        approverPositions: [
          {
            id: 'POS-003',
            positionTitle: 'HR Manager',
            isRequired: false,
          },
          {
            id: 'POS-004',
            positionTitle: 'HR Officer',
            isRequired: false,
          },
        ],
        approvalLogic: 'any',
        isMandatory: true,
        autoEscalateAfterDays: 2,
        allowDelegation: true,
        notifyAllPositions: false,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'SYSTEM',
  },
  {
    id: 'WF-002',
    departmentId: 'DEPT-003',
    departmentName: 'Finance',
    leaveType: 'all',
    isDefault: false,
    isActive: true,
    description: 'Finance department requires additional CFO approval for all leave types',
    stages: [
      {
        id: 'STAGE-003',
        order: 1,
        stageName: 'Department Manager Approval',
        approverPositions: [
          {
            id: 'POS-005',
            positionTitle: 'Finance Manager',
            departmentId: 'DEPT-003',
            isRequired: false,
          },
          {
            id: 'POS-006',
            positionTitle: 'Deputy Finance Manager',
            departmentId: 'DEPT-003',
            isRequired: false,
          },
        ],
        approvalLogic: 'any',
        isMandatory: true,
        autoEscalateAfterDays: 3,
        escalateTo: 'CEO',
        allowDelegation: true,
        notifyAllPositions: true,
      },
      {
        id: 'STAGE-004',
        order: 2,
        stageName: 'CFO Approval',
        approverPositions: [
          {
            id: 'POS-007',
            positionTitle: 'CEO',
            isRequired: false,
          },
          {
            id: 'POS-008',
            positionTitle: 'Deputy CEO',
            isRequired: false,
          },
        ],
        approvalLogic: 'any',
        isMandatory: true,
        autoEscalateAfterDays: 2,
        allowDelegation: false,
        notifyAllPositions: false,
      },
      {
        id: 'STAGE-005',
        order: 3,
        stageName: 'HR Final Review',
        approverPositions: [
          {
            id: 'POS-009',
            positionTitle: 'HR Manager',
            isRequired: false,
          },
        ],
        approvalLogic: 'any',
        isMandatory: true,
        autoEscalateAfterDays: 2,
        allowDelegation: true,
        notifyAllPositions: false,
      },
    ],
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-02-15T00:00:00Z',
    createdBy: 'collen.chingadayi@ewesacco.org',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ApprovalWorkflowConfigPage = () => {
  const [workflows, setWorkflows] = useState<DepartmentWorkflow[]>(mockWorkflows);
  const [searchText, setSearchText] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterLeaveType, setFilterLeaveType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<DepartmentWorkflow | null>(null);

  const [form] = Form.useForm();

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        searchText === '' ||
        workflow.departmentName.toLowerCase().includes(searchText.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchText.toLowerCase());

      const matchesDepartment =
        filterDepartment === 'all' || workflow.departmentId === filterDepartment;

      const matchesLeaveType =
        filterLeaveType === 'all' || workflow.leaveType === filterLeaveType;

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && workflow.isActive) ||
        (filterStatus === 'inactive' && !workflow.isActive);

      return matchesSearch && matchesDepartment && matchesLeaveType && matchesStatus;
    });
  }, [workflows, searchText, filterDepartment, filterLeaveType, filterStatus]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCreateWorkflow = () => {
    form.resetFields();
    setIsCreateModalOpen(true);
  };

  const handleEditWorkflow = (workflow: DepartmentWorkflow) => {
    setSelectedWorkflow(workflow);
    form.setFieldsValue(workflow);
    setIsEditModalOpen(true);
  };

  const handleViewWorkflow = (workflow: DepartmentWorkflow) => {
    setSelectedWorkflow(workflow);
    setIsViewDrawerOpen(true);
  };

  const handleDuplicateWorkflow = (workflow: DepartmentWorkflow) => {
    const newWorkflow: DepartmentWorkflow = {
      ...workflow,
      id: `WF-${Date.now()}`,
      departmentName: `${workflow.departmentName} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkflows([...workflows, newWorkflow]);
    message.success('Workflow duplicated successfully');
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
    message.success('Workflow deleted successfully');
  };

  const handleToggleStatus = (id: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id ? { ...w, isActive: !w.isActive, updatedAt: new Date().toISOString() } : w
      )
    );
    message.success('Workflow status updated');
  };

  const handleSaveWorkflow = async (values: any) => {
    // In real app, this would call an API
    console.log('Saving workflow:', values);
    message.success('Workflow saved successfully');
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    form.resetFields();
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns: ColumnsType<DepartmentWorkflow> = [
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      sorter: (a, b) => a.departmentName.localeCompare(b.departmentName),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.isDefault && <Tag color="blue">DEFAULT</Tag>}
        </Space>
      ),
    },
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 150,
      render: (type) => {
        const leaveType = mockLeaveTypes.find((lt) => lt.value === type);
        return <Tag>{leaveType?.label || type}</Tag>;
      },
    },
    {
      title: 'Stages',
      dataIndex: 'stages',
      key: 'stages',
      width: 100,
      align: 'center',
      render: (stages: WorkflowStage[]) => (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          {stages.length} Stage{stages.length !== 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Total Approvers',
      key: 'totalApprovers',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const total = record.stages.reduce(
          (sum, stage) => sum + stage.approverPositions.length,
          0
        );
        return (
          <Tag color="blue" icon={<TeamOutlined />}>
            {total} Position{total !== 1 ? 's' : ''}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) =>
        isActive ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Active
          </Tag>
        ) : (
          <Tag color="default">Inactive</Tag>
        ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewWorkflow(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditWorkflow(record)}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicateWorkflow(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
            <Switch
              size="small"
              checked={record.isActive}
              onChange={() => handleToggleStatus(record.id)}
            />
          </Tooltip>
          {!record.isDefault && (
            <Popconfirm
              title="Delete Workflow"
              description="Are you sure you want to delete this workflow?"
              onConfirm={() => handleDeleteWorkflow(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>
          <ApartmentOutlined style={{ marginRight: '8px' }} />
          Approval Workflow Configuration
        </Title>
        <Paragraph type="secondary">
          Configure department-specific approval workflows for leave requests. Each stage can have
          multiple positions for redundancy when an approver is unavailable.
        </Paragraph>
      </div>

      {/* Info Alert */}
      <Alert
        title="How Approval Workflows Work"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li>
              <strong>Multiple Positions per Stage:</strong> Add multiple positions (e.g.,
              "Department Manager" and "Team Lead") to ensure approval can proceed when one person
              is unavailable.
            </li>
            <li>
              <strong>Approval Logic:</strong> Choose "Any Position" (only one needs to approve) or
              "All Positions" (all must approve) for each stage.
            </li>
            <li>
              <strong>Sequential Stages:</strong> Approval progresses through stages in order.
              Stage 2 only becomes active after Stage 1 is approved.
            </li>
            <li>
              <strong>Auto-Escalation:</strong> If no action is taken within the specified days,
              the request automatically escalates to the next level.
            </li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Filters and Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input.Search
              placeholder="Search workflows..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Department"
              value={filterDepartment}
              onChange={setFilterDepartment}
            >
              <Option value="all">All Departments</Option>
              {mockDepartments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Leave Type"
              value={filterLeaveType}
              onChange={setFilterLeaveType}
            >
              {mockLeaveTypes.map((lt) => (
                <Option key={lt.value} value={lt.value}>
                  {lt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Status"
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} style={{ marginLeft: 'auto' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateWorkflow} block>
              Create Workflow
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Workflows Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredWorkflows}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} workflow${total !== 1 ? 's' : ''}`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* View Workflow Drawer */}
      <Drawer
        title={
          <Space>
            <ApartmentOutlined />
            Workflow Details
          </Space>
        }
        width={720}
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
      >
        {selectedWorkflow && (
          <div>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Department</Text>
                  <div>
                    <Text strong>{selectedWorkflow.departmentName}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Leave Type</Text>
                  <div>
                    <Tag>
                      {mockLeaveTypes.find((lt) => lt.value === selectedWorkflow.leaveType)
                        ?.label || selectedWorkflow.leaveType}
                    </Tag>
                  </div>
                </Col>
                <Col span={24}>
                  <Text type="secondary">Description</Text>
                  <div>
                    <Text>{selectedWorkflow.description || 'No description'}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Status</Text>
                  <div>
                    {selectedWorkflow.isActive ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Active
                      </Tag>
                    ) : (
                      <Tag color="default">Inactive</Tag>
                    )}
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Last Updated</Text>
                  <div>
                    <Text>{new Date(selectedWorkflow.updatedAt).toLocaleString('en-GB')}</Text>
                  </div>
                </Col>
              </Row>
            </Card>

            <Divider>Approval Stages</Divider>

            <Steps
              orientation="vertical"
              current={-1}
              items={selectedWorkflow.stages.map((stage, index) => ({
                title: `Stage ${stage.order}: ${stage.stageName}`,
                description: (
                  <Card size="small" style={{ marginTop: '8px', marginBottom: '16px' }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary">Approval Logic: </Text>
                        <Tag color={stage.approvalLogic === 'any' ? 'blue' : 'orange'}>
                          {stage.approvalLogic === 'any'
                            ? 'Any Position Can Approve'
                            : 'All Positions Must Approve'}
                        </Tag>
                      </div>

                      <div>
                        <Text type="secondary">Approver Positions:</Text>
                        <List
                          size="small"
                          dataSource={stage.approverPositions}
                          renderItem={(pos) => (
                            <List.Item style={{ padding: '4px 0' }}>
                              <Space>
                                <UserOutlined />
                                <Text>{pos.positionTitle}</Text>
                                {pos.isRequired && <Tag color="red">Required</Tag>}
                                {pos.departmentId && (
                                  <Tag color="purple">Department-Specific</Tag>
                                )}
                              </Space>
                            </List.Item>
                          )}
                        />
                      </div>

                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Text type="secondary">
                            <ClockCircleOutlined /> Auto-escalate:{' '}
                          </Text>
                          <Text>{stage.autoEscalateAfterDays} days</Text>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Delegation: </Text>
                          <Text>{stage.allowDelegation ? 'Allowed' : 'Not Allowed'}</Text>
                        </Col>
                        {stage.escalateTo && (
                          <Col span={24}>
                            <Text type="secondary">
                              <WarningOutlined /> Escalates to:{' '}
                            </Text>
                            <Text strong>{stage.escalateTo}</Text>
                          </Col>
                        )}
                        <Col span={24}>
                          <Text type="secondary">Notify all positions: </Text>
                          <Text>{stage.notifyAllPositions ? 'Yes' : 'No'}</Text>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                ),
                status: 'wait',
              }))}
            />
          </div>
        )}
      </Drawer>

      {/* Create/Edit Modal - Placeholder for now */}
      <Modal
        title={isEditModalOpen ? 'Edit Workflow' : 'Create New Workflow'}
        open={isCreateModalOpen || isEditModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          form.resetFields();
        }}
        width={900}
        footer={null}
      >
        <Alert
          title="Full Workflow Builder Coming Soon"
          description="The complete workflow builder with stage management, position assignment, and approval logic configuration will be available in the next update. For now, you can view and manage existing workflows."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form form={form} layout="vertical" onFinish={handleSaveWorkflow}>
          <Form.Item
            name="departmentId"
            label="Department"
            rules={[{ required: true, message: 'Please select a department' }]}
          >
            <Select placeholder="Select department">
              {mockDepartments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="leaveType"
            label="Leave Type"
            rules={[{ required: true, message: 'Please select a leave type' }]}
          >
            <Select placeholder="Select leave type">
              {mockLeaveTypes.map((lt) => (
                <Option key={lt.value} value={lt.value}>
                  {lt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe this workflow..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save Workflow
              </Button>
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
