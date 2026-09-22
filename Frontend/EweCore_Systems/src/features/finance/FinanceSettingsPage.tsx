/**
 * Finance Settings Page
 * Manage approval groups, workflows, and other finance-specific settings
 */

import { useState, useEffect } from 'react';
import {
  Tabs,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  Alert,
  Spin,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  SettingOutlined,
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../components/common';
import { DragDropMemberManager } from '../../components/common/DragDropMemberManager';
import {
  financeApprovalGroupsApi,
  financeWorkflowsApi,
  type ApprovalGroupList,
  type ApprovalGroupDetail,
  type ApprovalGroupCreateRequest,
  type WorkflowList,
  type WorkflowDetail,
  type EmployeeWithGroup,
} from '../../services/api/finance-settings';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

export const FinanceSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('groups');
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // APPROVAL GROUPS STATE
  // ============================================================================

  const [groups, setGroups] = useState<ApprovalGroupList[]>([]);
  const [allEmployeesWithGroups, setAllEmployeesWithGroups] = useState<EmployeeWithGroup[]>([]);

  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ApprovalGroupList | null>(null);
  const [manageMembersVisible, setManageMembersVisible] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<ApprovalGroupDetail | null>(null);

  const [groupForm] = Form.useForm();

  // ============================================================================
  // WORKFLOWS STATE
  // ============================================================================

  const [workflows, setWorkflows] = useState<WorkflowList[]>([]);
  const [workflowsByType, setWorkflowsByType] = useState<Record<string, WorkflowList[]>>({});
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDetail | null>(null);

  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowList | null>(null);

  const [workflowForm] = Form.useForm();

  // ============================================================================
  // LOAD DATA
  // ============================================================================

  const loadApprovalGroups = async () => {
    setLoading(true);
    try {
      const data = await financeApprovalGroupsApi.list();
      setGroups(data);
    } catch (error: any) {
      console.error('Failed to load approval groups:', error);
      message.error('Failed to load approval groups');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const [allWorkflows, byType] = await Promise.all([
        financeWorkflowsApi.list(),
        financeWorkflowsApi.byType(),
      ]);
      setWorkflows(allWorkflows);
      setWorkflowsByType(byType);
    } catch (error: any) {
      console.error('Failed to load workflows:', error);
      message.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesWithGroups = async () => {
    try {
      const data = await financeApprovalGroupsApi.getEmployeeGroups();
      setAllEmployeesWithGroups(data);
    } catch (error) {
      console.error('Failed to fetch employees with groups:', error);
    }
  };

  useEffect(() => {
    loadApprovalGroups();
    loadWorkflows();
    fetchEmployeesWithGroups();
  }, []);

  // ============================================================================
  // APPROVAL GROUPS HANDLERS
  // ============================================================================

  const handleCreateGroup = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    setGroupModalVisible(true);
  };

  const handleEditGroup = (group: ApprovalGroupList) => {
    setEditingGroup(group);
    groupForm.setFieldsValue({
      code: group.code,
      name: group.name,
      description: group.description,
      group_type: group.group_type,
      department: group.department,
      is_active: group.is_active,
    });
    setGroupModalVisible(true);
  };

  const handleSaveGroup = async (values: any) => {
    try {
      const data: ApprovalGroupCreateRequest = {
        name: values.name,
        description: values.description,
        group_type: 'custom', // Default to custom for finance groups
        category: 'finance', // Always finance for this page
        is_active: values.is_active ?? true,
      };

      if (editingGroup) {
        await financeApprovalGroupsApi.partialUpdate(editingGroup.id, data);
        message.success('Approval group updated successfully');
      } else {
        const created = await financeApprovalGroupsApi.create(data);
        message.success(`Approval group created successfully! Code: ${created.code}`);
      }

      setGroupModalVisible(false);
      groupForm.resetFields();
      loadApprovalGroups();
    } catch (error: any) {
      console.error('Failed to save approval group:', error);
      message.error(error.response?.data?.name?.[0] || 'Failed to save approval group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await financeApprovalGroupsApi.delete(id);
      message.success('Approval group deleted successfully');
      loadApprovalGroups();
    } catch (error: any) {
      console.error('Failed to delete approval group:', error);
      message.error('Failed to delete approval group');
    }
  };

  const handleManageMembers = async (group: ApprovalGroupList) => {
    try {
      const groupDetail = await financeApprovalGroupsApi.retrieve(group.id);
      setSelectedGroupForMembers(groupDetail);
      setManageMembersVisible(true);
    } catch (error: any) {
      console.error('Failed to load group details:', error);
      message.error('Failed to load group details');
    }
  };

  const handleSaveMembers = async (addedMembers: any[], removedMemberIds: string[]) => {
    if (!selectedGroupForMembers) return;

    try {
      // Remove members first
      for (const memberId of removedMemberIds) {
        await financeApprovalGroupsApi.removeMember(selectedGroupForMembers.id, memberId);
      }

      // Add members
      for (const member of addedMembers) {
        await financeApprovalGroupsApi.addMember(selectedGroupForMembers.id, {
          employee_id: member.id,
          role: member.role,
        });
      }

      message.success('Group members updated successfully');
      await loadApprovalGroups();
      await fetchEmployeesWithGroups();

      setManageMembersVisible(false);
      setSelectedGroupForMembers(null);
    } catch (error: any) {
      console.error('Failed to save members:', error);
      message.error(error?.response?.data?.detail || 'Failed to save members');
      throw error;
    }
  };

  // ============================================================================
  // APPROVAL GROUPS TABLE
  // ============================================================================

  const groupColumns: ColumnsType<ApprovalGroupList> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Text strong style={{ color: '#0693e3' }}>{code}</Text>,
    },
    {
      title: 'Group Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'group_type_display',
      key: 'group_type_display',
      width: 150,
    },
    {
      title: 'Members',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 100,
      render: (count: number) => (
        <Tag color="blue" icon={<TeamOutlined />}>
          {count} {count === 1 ? 'member' : 'members'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success" icon={<CheckOutlined />}>
            Active
          </Tag>
        ) : (
          <Tag color="default" icon={<CloseOutlined />}>
            Inactive
          </Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<TeamOutlined />} onClick={() => handleManageMembers(record)}>
            Members
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditGroup(record)} />
          <Popconfirm
            title="Delete group?"
            description="Are you sure you want to delete this approval group?"
            onConfirm={() => handleDeleteGroup(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ============================================================================
  // WORKFLOWS HANDLERS
  // ============================================================================

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    workflowForm.resetFields();
    workflowForm.setFieldsValue({
      stages: [
        {
          stage_number: 1,
          stage_name: 'Initial Approval',
          approver_type: 'position',
          approval_logic: 'any',
          is_required: true,
        },
      ],
    });
    setWorkflowModalVisible(true);
  };

  const handleEditWorkflow = (workflow: WorkflowList) => {
    setEditingWorkflow(workflow);
    // TODO: Load full workflow details and populate form
    setWorkflowModalVisible(true);
  };

  const handleSaveWorkflow = async (values: any) => {
    try {
      const data = {
        workflow_name: values.workflow_name,
        description: values.description,
        workflow_type: values.workflow_type,
        stages: values.stages,
        applicable_group_ids: values.applicable_group_ids,
        is_active: values.is_active ?? true,
        allow_parallel_approval: values.allow_parallel_approval ?? false,
        require_sequential: values.require_sequential ?? true,
        escalation_enabled: values.escalation_enabled ?? false,
        escalation_hours: values.escalation_hours,
      };

      if (editingWorkflow) {
        await financeWorkflowsApi.update(editingWorkflow.id, data);
        message.success('Workflow updated successfully');
      } else {
        await financeWorkflowsApi.create(data);
        message.success('Workflow created successfully');
      }

      setWorkflowModalVisible(false);
      workflowForm.resetFields();
      loadWorkflows();
    } catch (error: any) {
      console.error('Failed to save workflow:', error);
      message.error(error.response?.data?.detail || 'Failed to save workflow');
    }
  };

  const handleToggleWorkflowActive = async (id: string) => {
    try {
      await financeWorkflowsApi.toggleActive(id);
      message.success('Workflow status updated');
      loadWorkflows();
    } catch (error: any) {
      console.error('Failed to toggle workflow:', error);
      message.error('Failed to update workflow status');
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await financeWorkflowsApi.delete(id);
      message.success('Workflow deleted successfully');
      loadWorkflows();
    } catch (error: any) {
      console.error('Failed to delete workflow:', error);
      message.error('Failed to delete workflow');
    }
  };

  const handleDuplicateWorkflow = async (id: string, currentName: string) => {
    const newName = prompt(`Enter name for duplicated workflow:`, `${currentName} (Copy)`);
    if (!newName) return;

    try {
      await financeWorkflowsApi.duplicate(id, newName);
      message.success('Workflow duplicated successfully');
      loadWorkflows();
    } catch (error: any) {
      console.error('Failed to duplicate workflow:', error);
      message.error('Failed to duplicate workflow');
    }
  };

  // ============================================================================
  // WORKFLOWS TABLE
  // ============================================================================

  const workflowColumns: ColumnsType<WorkflowList> = [
    {
      title: 'Workflow Name',
      dataIndex: 'workflow_name',
      key: 'workflow_name',
      width: 200,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'workflow_type_display',
      key: 'workflow_type_display',
      width: 150,
    },
    {
      title: 'Stages',
      dataIndex: 'stage_count',
      key: 'stage_count',
      width: 80,
      render: (count: number) => <Tag color="purple">{count} stages</Tag>,
    },
    {
      title: 'Groups',
      dataIndex: 'applicable_group_codes',
      key: 'applicable_group_codes',
      width: 150,
      render: (groupCodes: string[]) =>
        groupCodes.length > 0 ? (
          <Space wrap>
            {groupCodes.map(code => (
              <Tag key={code} color="blue">
                {code}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">Default</Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success" icon={<CheckOutlined />}>
            Active
          </Tag>
        ) : (
          <Tag color="default" icon={<CloseOutlined />}>
            Inactive
          </Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleToggleWorkflowActive(record.id)}>
            {record.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleDuplicateWorkflow(record.id, record.workflow_name)}>
            Duplicate
          </Button>
          <Popconfirm
            title="Delete workflow?"
            description="Are you sure you want to delete this workflow?"
            onConfirm={() => handleDeleteWorkflow(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  const tabItems = [
    {
      key: 'groups',
      label: (
        <span>
          <TeamOutlined /> Approval Groups
        </span>
      ),
      children: (
        <Card>
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            <Alert
              title="Manage Finance Approval Groups"
              description="Create and manage approval groups for finance operations. Members of these groups can approve petty cash, payables, receivables, and other finance requests."
              type="info"
              showIcon
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateGroup}>
                Create Approval Group
              </Button>
            </div>

            <Table
              columns={groupColumns}
              dataSource={groups}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Space>
        </Card>
      ),
    },
    {
      key: 'workflows',
      label: (
        <span>
          <SettingOutlined /> Workflows
        </span>
      ),
      children: (
        <Card>
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            <Alert
              title="Manage Finance Workflows"
              description="Configure approval workflows for different finance modules. Define approval stages, approvers, and conditions for each workflow type."
              type="info"
              showIcon
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateWorkflow}>
                Create Workflow
              </Button>
            </div>

            <Table
              columns={workflowColumns}
              dataSource={workflows}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Finance Settings"
        subtitle="Configure approval groups, workflows, and finance-specific settings"
        breadcrumbs={[{ title: 'Finance' }, { title: 'Settings' }]}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Group Create/Edit Modal */}
      <Modal
        title={editingGroup ? 'Edit Approval Group' : 'Create Approval Group'}
        open={groupModalVisible}
        onCancel={() => {
          setGroupModalVisible(false);
          groupForm.resetFields();
        }}
        onOk={groupForm.submit}
        width={600}
      >
        <Form form={groupForm} layout="vertical" onFinish={handleSaveGroup}>
          <Form.Item label="Group Name" name="name" rules={[{ required: true, message: 'Please enter group name' }]}>
            <Input placeholder="Treasury Approval Team" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Purpose and membership criteria..." />
          </Form.Item>

          <Form.Item label="Category">
            <Tag color="blue">Finance</Tag>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              This group handles finance-related approvals
            </Text>
          </Form.Item>

          <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            title="Group Code"
            description="A unique code will be automatically generated based on the group name (e.g., GRP-FIN-TAT for 'Treasury Approval Team')"
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>

      {/* Drag-Drop Member Management - Exact consistency with Leave Settings */}
      <DragDropMemberManager
        visible={manageMembersVisible}
        group={selectedGroupForMembers ? {
          id: selectedGroupForMembers.id,
          code: selectedGroupForMembers.code,
          name: selectedGroupForMembers.name,
        } : null}
        onClose={() => {
          setManageMembersVisible(false);
          setSelectedGroupForMembers(null);
        }}
        onSave={handleSaveMembers}
        allEmployees={allEmployeesWithGroups}
        currentMembers={selectedGroupForMembers?.members_detail || []}
      />

      {/* Workflow Create/Edit Modal - Copied from Leave Settings */}
      <Modal
        title={editingWorkflow ? 'Edit Finance Workflow' : 'Create Finance Workflow'}
        open={workflowModalVisible}
        onCancel={() => {
          setWorkflowModalVisible(false);
          workflowForm.resetFields();
        }}
        onOk={workflowForm.submit}
        width={900}
        okText="Save"
      >
        <Form form={workflowForm} layout="vertical" onFinish={handleSaveWorkflow}>
          {/* Workflow Name */}
          <Form.Item
            label="Workflow Name"
            name="workflow_name"
            rules={[{ required: true, message: 'Please enter workflow name' }]}
          >
            <Input placeholder="e.g., Petty Cash Approval Workflow" />
          </Form.Item>

          {/* Description */}
          <Form.Item label="Description" name="description">
            <TextArea rows={2} placeholder="Describe this workflow..." />
          </Form.Item>

          {/* Workflow Type */}
          <Form.Item
            label="Workflow Type"
            name="workflow_type"
            rules={[{ required: true, message: 'Please select workflow type' }]}
          >
            <Select placeholder="Select finance module">
              <Option value="petty_cash">Petty Cash</Option>
              <Option value="payable">Payables</Option>
              <Option value="receivable">Receivables</Option>
              <Option value="expense">Expenses</Option>
              <Option value="procurement">Procurement</Option>
            </Select>
          </Form.Item>

          {/* Is Active */}
          <Form.Item label="Is Active" name="is_active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          {/* Applies to Group */}
          <Form.Item
            label="Applies to Group (Optional)"
            name="applicable_group_ids"
            tooltip="This workflow applies only to members of selected approval groups. Leave empty for default workflow."
          >
            <Select
              mode="multiple"
              placeholder="Select approval groups (optional)"
              showSearch
              allowClear
              filterOption={(input, option: any) =>
                option?.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {groups.map((group) => (
                <Option key={group.id} value={group.id}>
                  {group.name} ({group.code}) - {group.member_count} members
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Approval Stages */}
          <Divider>Approval Stages (Multi-Approver Support)</Divider>

          <Alert
            title="Multi-Approver Workflow"
            description={
              <div>
                <p><strong>Create unlimited approval stages.</strong> For each stage:</p>
                <ul>
                  <li><strong>Select specific employees</strong> who can approve (from any group)</li>
                  <li><strong>Approval Logic:</strong>
                    <ul>
                      <li><strong>"Any One"</strong> - Any ONE approver can approve (for redundancy/flexibility)</li>
                      <li><strong>"All Must Approve"</strong> - ALL selected approvers must approve (for critical decisions)</li>
                    </ul>
                  </li>
                </ul>
                <p><strong>Example:</strong> Petty Cash → Stage 1: Finance Officer (any) → Stage 2: CFO (approve)</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          {/* Dynamic Stages */}
          <Form.List name="stages">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`Stage ${index + 1}`}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => remove(field.name)}
                        >
                          Remove
                        </Button>
                      )
                    }
                    style={{ marginBottom: '16px' }}
                  >
                    {/* Stage Name and Action Type */}
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          label="Stage Name"
                          name={[field.name, 'stage_name']}
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input placeholder={`Stage ${index + 1} Name`} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          label="Action Type"
                          name={[field.name, 'action_type']}
                          initialValue="approve"
                          tooltip="What action should approvers take at this stage?"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Select placeholder="Select action type">
                            <Option value="certify">Certify (Verify accuracy)</Option>
                            <Option value="recommend">Recommend (Give opinion)</Option>
                            <Option value="approve">Approve (Final decision)</Option>
                            <Option value="review">Review (Check & comment)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Hidden field - always "specific" */}
                    <Form.Item
                      {...field}
                      name={[field.name, 'approver_type']}
                      hidden
                      initialValue="specific"
                    >
                      <Input />
                    </Form.Item>

                    {/* Approvers Selection */}
                    <Row gutter={16}>
                      <Col span={16}>
                        <Form.Item
                          {...field}
                          label="Approvers"
                          name={[field.name, 'approver_employee_ids']}
                          tooltip="Select employees who can approve at this stage"
                          rules={[{ required: true, message: 'Please select at least one approver' }]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="Select employees who can approve this stage"
                            showSearch
                            filterOption={(input, option: any) =>
                              option?.children?.toLowerCase().includes(input.toLowerCase())
                            }
                          >
                            {allEmployeesWithGroups.map((emp) => (
                              <Option key={emp.employee_id} value={emp.employee_id}>
                                {emp.employee_name} ({emp.employee_number})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          label="Approval Logic"
                          name={[field.name, 'approval_logic']}
                          tooltip="'Any' = any one approver can approve. 'All' = all approvers must approve."
                          initialValue="any"
                        >
                          <Select>
                            <Option value="any">Any One</Option>
                            <Option value="all">All Must Approve</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Is Required */}
                    <Form.Item
                      {...field}
                      label="Is Required Stage"
                      name={[field.name, 'is_required']}
                      valuePropName="checked"
                      initialValue={true}
                    >
                      <Switch />
                    </Form.Item>
                  </Card>
                ))}

                {/* Add Stage Button */}
                <Button
                  type="dashed"
                  onClick={() => add({
                    stage_number: fields.length + 1,
                    stage_name: `Stage ${fields.length + 1}`,
                    approver_type: 'specific',
                    action_type: 'approve',
                    approval_logic: 'any',
                    is_required: true,
                    approver_employee_ids: [],
                  })}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Approval Stage
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};
