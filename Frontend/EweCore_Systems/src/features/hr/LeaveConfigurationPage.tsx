/**
 * Leave Configuration Page - Admin Interface
 *
 * 6-Tab interface for configuring the entire leave management system:
 * 1. Leave Policies - Configure leave types, entitlements, rules
 * 2. Approval Workflows - Define approval chains per leave type
 * 3. Public Holidays - Manage holiday calendar
 * 4. Eligibility Rules - Configure who can access which leave types
 * 5. System Settings - Global leave system configuration
 * 6. Audit Log - Change history and audit trail
 */

import { useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  DatePicker,
  Alert,
  message,
  Descriptions,
  Divider,
  Row,
  Col,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  FileProtectOutlined,
  CalendarOutlined,
  TeamOutlined,
  HistoryOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/common';
import { useLeaveConfigStore } from '../../store/leaveConfigStore';
import { useAuthStore } from '../../store/authStore';
import type {
  LeavePolicy,
  ApprovalFlow,
  PublicHoliday,
  EligibilityRule,
} from '../../types/leave-ledger';

const { TabPane } = Tabs;
const { TextArea } = Input;

export const LeaveConfigurationPage = () => {
  const { user } = useAuthStore();
  const {
    policies,
    approvalFlows,
    publicHolidays,
    eligibilityRules,
    systemSettings,
    changeLog,
    loading,
    saving,
    createPolicy,
    updatePolicy,
    deletePolicy,
    activatePolicy,
    deactivatePolicy,
    createApprovalFlow,
    updateApprovalFlow,
    deleteApprovalFlow,
    createPublicHoliday,
    updatePublicHoliday,
    deletePublicHoliday,
    importPublicHolidays,
    createEligibilityRule,
    updateEligibilityRule,
    deleteEligibilityRule,
    updateSystemSettings,
    validatePolicyChange,
    validateWorkflowChange,
    exportConfiguration,
    importConfiguration,
    resetToDefaults,
  } = useLeaveConfigStore();

  // State
  const [activeTab, setActiveTab] = useState('1');
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Forms
  const [policyForm] = Form.useForm();
  const [workflowForm] = Form.useForm();
  const [holidayForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  // ==================== POLICY MANAGEMENT ====================

  const handleCreatePolicy = () => {
    setEditingItem(null);
    policyForm.resetFields();
    setPolicyModalVisible(true);
  };

  const handleEditPolicy = (policy: LeavePolicy) => {
    setEditingItem(policy);
    policyForm.setFieldsValue(policy);
    setPolicyModalVisible(true);
  };

  const handleSavePolicy = async () => {
    try {
      const values = await policyForm.validateFields();

      // Validate
      const validation = validatePolicyChange(values);
      if (!validation.isValid) {
        Modal.error({
          title: 'Validation Errors',
          content: (
            <ul>
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          ),
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        const confirmed = await new Promise((resolve) => {
          Modal.warning({
            title: 'Validation Warnings',
            content: (
              <div>
                <ul>
                  {validation.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
                <p>Do you want to proceed anyway?</p>
              </div>
            ),
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        if (!confirmed) return;
      }

      if (editingItem) {
        await updatePolicy(user?.id || 'SYSTEM', editingItem.id, values);
        message.success('Policy updated successfully');
      } else {
        await createPolicy(user?.id || 'SYSTEM', values);
        message.success('Policy created successfully');
      }

      setPolicyModalVisible(false);
      policyForm.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save policy');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await deletePolicy(user?.id || 'SYSTEM', policyId);
      message.success('Policy deleted successfully');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to delete policy');
    }
  };

  const handleTogglePolicy = async (policy: LeavePolicy) => {
    try {
      if (policy.isActive) {
        await deactivatePolicy(user?.id || 'SYSTEM', policy.id);
        message.success('Policy deactivated');
      } else {
        await activatePolicy(user?.id || 'SYSTEM', policy.id);
        message.success('Policy activated');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to toggle policy');
    }
  };

  // Policy columns
  const policyColumns: ColumnsType<LeavePolicy> = [
    {
      title: 'Leave Type',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text: string, record: LeavePolicy) => (
        <Space>
          <span style={{ fontWeight: 600 }}>{text}</span>
          {record.isStatutory && (
            <Tag color="blue" icon={<FileProtectOutlined />}>
              Statutory
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Entitlement',
      dataIndex: 'annualEntitlementDays',
      key: 'annualEntitlementDays',
      width: 120,
      render: (days: number) => `${days} days`,
    },
    {
      title: 'Accrual',
      dataIndex: 'accrualMethod',
      key: 'accrualMethod',
      width: 100,
      render: (method: string) => <Tag>{method.toUpperCase()}</Tag>,
    },
    {
      title: 'Pay Status',
      dataIndex: 'isPaid',
      key: 'isPaid',
      width: 100,
      render: (isPaid: boolean) => (
        <Tag color={isPaid ? 'green' : 'red'}>{isPaid ? 'PAID' : 'UNPAID'}</Tag>
      ),
    },
    {
      title: 'Max Cap',
      dataIndex: 'maxAccumulationDays',
      key: 'maxAccumulationDays',
      width: 100,
      render: (days?: number) => days ? `${days} days` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: LeavePolicy) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPolicy(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleTogglePolicy(record)}
          >
            {record.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          {!record.isStatutory && (
            <Popconfirm
              title="Delete Policy"
              description="Are you sure you want to delete this policy?"
              onConfirm={() => handleDeletePolicy(record.id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ==================== WORKFLOW MANAGEMENT ====================

  const handleCreateWorkflow = () => {
    setEditingItem(null);
    workflowForm.resetFields();
    setWorkflowModalVisible(true);
  };

  const handleEditWorkflow = (workflow: ApprovalFlow) => {
    setEditingItem(workflow);
    workflowForm.setFieldsValue(workflow);
    setWorkflowModalVisible(true);
  };

  const handleSaveWorkflow = async () => {
    try {
      const values = await workflowForm.validateFields();

      // Validate
      const validation = validateWorkflowChange(values);
      if (!validation.isValid) {
        Modal.error({
          title: 'Validation Errors',
          content: (
            <ul>
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          ),
        });
        return;
      }

      if (editingItem) {
        await updateApprovalFlow(user?.id || 'SYSTEM', editingItem.id, values);
        message.success('Workflow updated successfully');
      } else {
        await createApprovalFlow(user?.id || 'SYSTEM', values);
        message.success('Workflow created successfully');
      }

      setWorkflowModalVisible(false);
      workflowForm.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await deleteApprovalFlow(user?.id || 'SYSTEM', workflowId);
      message.success('Workflow deleted successfully');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to delete workflow');
    }
  };

  // Workflow columns
  const workflowColumns: ColumnsType<ApprovalFlow> = [
    {
      title: 'Leave Type',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Stages',
      dataIndex: 'stages',
      key: 'stages',
      render: (stages: any[]) => `${stages.length} stage${stages.length !== 1 ? 's' : ''}`,
    },
    {
      title: 'Approval Chain',
      dataIndex: 'stages',
      key: 'chain',
      render: (stages: any[]) => (
        <div>
          {stages.map((stage, i) => (
            <Tag key={i} style={{ margin: '2px' }}>
              {stage.approverRole}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: ApprovalFlow) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditWorkflow(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Workflow"
            description="Are you sure?"
            onConfirm={() => handleDeleteWorkflow(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== HOLIDAY MANAGEMENT ====================

  const handleCreateHoliday = () => {
    setEditingItem(null);
    holidayForm.resetFields();
    setHolidayModalVisible(true);
  };

  const handleEditHoliday = (holiday: PublicHoliday) => {
    setEditingItem(holiday);
    holidayForm.setFieldsValue({
      ...holiday,
      date: dayjs(holiday.date),
    });
    setHolidayModalVisible(true);
  };

  const handleSaveHoliday = async () => {
    try {
      const values = await holidayForm.validateFields();
      const formattedValues = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        year: values.date.year(),
      };

      if (editingItem) {
        await updatePublicHoliday(user?.id || 'SYSTEM', editingItem.id, formattedValues);
        message.success('Holiday updated successfully');
      } else {
        await createPublicHoliday(user?.id || 'SYSTEM', formattedValues);
        message.success('Holiday created successfully');
      }

      setHolidayModalVisible(false);
      holidayForm.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save holiday');
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      await deletePublicHoliday(user?.id || 'SYSTEM', holidayId);
      message.success('Holiday deleted successfully');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to delete holiday');
    }
  };

  // Holiday columns
  const holidayColumns: ColumnsType<PublicHoliday> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: 'Holiday Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      width: 80,
    },
    {
      title: 'Recurring',
      dataIndex: 'isRecurring',
      key: 'isRecurring',
      width: 100,
      render: (isRecurring: boolean) => (
        <Tag color={isRecurring ? 'blue' : 'default'}>
          {isRecurring ? 'YES' : 'NO'}
        </Tag>
      ),
    },
    {
      title: 'Affects Leave',
      dataIndex: 'affectsLeaveCalculation',
      key: 'affectsLeaveCalculation',
      width: 120,
      render: (affects: boolean) => (
        <Tag color={affects ? 'green' : 'default'}>
          {affects ? 'YES' : 'NO'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: PublicHoliday) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditHoliday(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Holiday"
            description="Are you sure?"
            onConfirm={() => handleDeleteHoliday(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== SYSTEM SETTINGS ====================

  const handleSaveSettings = async () => {
    try {
      const values = await settingsForm.validateFields();
      await updateSystemSettings(user?.id || 'SYSTEM', values);
      message.success('System settings updated successfully');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to update settings');
    }
  };

  // ==================== EXPORT/IMPORT ====================

  const handleExport = () => {
    try {
      const config = exportConfiguration();
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave-config-${dayjs().format('YYYY-MM-DD')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Configuration exported successfully');
    } catch (error) {
      message.error('Failed to export configuration');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      try {
        const file = e.target.files[0];
        const text = await file.text();
        await importConfiguration(user?.id || 'SYSTEM', text);
        message.success('Configuration imported successfully');
      } catch (error) {
        message.error('Failed to import configuration');
      }
    };
    input.click();
  };

  const handleResetToDefaults = () => {
    Modal.confirm({
      title: 'Reset to Defaults',
      content: 'Are you sure you want to reset all configuration to default values? This cannot be undone.',
      okText: 'Reset',
      okType: 'danger',
      onOk: async () => {
        try {
          await resetToDefaults(user?.id || 'SYSTEM');
          message.success('Configuration reset to defaults');
        } catch (error) {
          message.error('Failed to reset configuration');
        }
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Leave System Configuration"
        subtitle="Configure leave policies, workflows, and system settings"
        breadcrumbs={[
          { title: 'Human Resources' },
          { title: 'Leave Management', path: '/hr/leaves' },
          { title: 'Configuration' },
        ]}
        actions={
          <Space>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              Import Config
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              Export Config
            </Button>
            <Popconfirm
              title="Reset to defaults?"
              description="This will reset all configuration. Are you sure?"
              onConfirm={handleResetToDefaults}
            >
              <Button danger icon={<WarningOutlined />}>
                Reset to Defaults
              </Button>
            </Popconfirm>
          </Space>
        }
      />

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* TAB 1: LEAVE POLICIES */}
          <TabPane
            tab={
              <span>
                <FileProtectOutlined />
                Leave Policies
              </span>
            }
            key="1"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePolicy}
              >
                Create Policy
              </Button>
            </div>
            <Table
              columns={policyColumns}
              dataSource={policies}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          {/* TAB 2: APPROVAL WORKFLOWS */}
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Approval Workflows
              </span>
            }
            key="2"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateWorkflow}
              >
                Create Workflow
              </Button>
            </div>
            <Table
              columns={workflowColumns}
              dataSource={approvalFlows}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          {/* TAB 3: PUBLIC HOLIDAYS */}
          <TabPane
            tab={
              <span>
                <CalendarOutlined />
                Public Holidays
              </span>
            }
            key="3"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateHoliday}
              >
                Add Holiday
              </Button>
            </div>
            <Table
              columns={holidayColumns}
              dataSource={publicHolidays}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 15 }}
            />
          </TabPane>

          {/* TAB 4: ELIGIBILITY RULES */}
          <TabPane
            tab={
              <span>
                <CheckCircleOutlined />
                Eligibility Rules
              </span>
            }
            key="4"
          >
            <Alert
              message="Eligibility Rules"
              description="Configure which employees are eligible for which leave types based on service, department, job grade, etc."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Table
              dataSource={eligibilityRules}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: 'Rule Name', dataIndex: 'ruleName', key: 'ruleName' },
                { title: 'Leave Type', dataIndex: 'leaveType', key: 'leaveType' },
                {
                  title: 'Min Service',
                  dataIndex: 'minimumServiceDays',
                  key: 'minimumServiceDays',
                  render: (days?: number) => days ? `${days} days` : '-',
                },
                {
                  title: 'Status',
                  dataIndex: 'isActive',
                  key: 'isActive',
                  render: (isActive: boolean) => (
                    <Tag color={isActive ? 'success' : 'default'}>
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Tag>
                  ),
                },
              ]}
            />
          </TabPane>

          {/* TAB 5: SYSTEM SETTINGS */}
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                System Settings
              </span>
            }
            key="5"
          >
            <Form
              form={settingsForm}
              layout="vertical"
              initialValues={systemSettings}
              onFinish={handleSaveSettings}
            >
              <Row gutter={[24, 0]}>
                <Col span={12}>
                  <Form.Item
                    label="Fiscal Year Start Month"
                    name="fiscalYearStartMonth"
                    tooltip="Month when fiscal year begins (1=January, 12=December)"
                  >
                    <Select>
                      {Array.from({ length: 12 }, (_, i) => (
                        <Select.Option key={i + 1} value={i + 1}>
                          {dayjs().month(i).format('MMMM')}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Accrual Run Day of Month"
                    name="accrualRunDayOfMonth"
                    tooltip="Day of month when automatic accrual runs"
                  >
                    <InputNumber min={1} max={31} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 0]}>
                <Col span={8}>
                  <Form.Item
                    label="Enable Leave Carryforward"
                    name="enableLeaveCarryForward"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Enable Automatic Accrual"
                    name="enableAutomaticAccrual"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Enable Email Notifications"
                    name="enableEmailNotifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 0]}>
                <Col span={12}>
                  <Form.Item
                    label="Sick Leave Medical Cert Threshold (days)"
                    name="sickLeaveAttachmentThresholdDays"
                    tooltip="Medical certificate required after this many days"
                  >
                    <InputNumber min={1} max={30} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Advance Booking Max Months"
                    name="advanceBookingMaxMonths"
                    tooltip="How far in advance can leave be booked"
                  >
                    <InputNumber min={1} max={24} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save Settings
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* TAB 6: AUDIT LOG */}
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                Audit Log
              </span>
            }
            key="6"
          >
            <Table
              dataSource={changeLog}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 20 }}
              columns={[
                {
                  title: 'Timestamp',
                  dataIndex: 'changedAt',
                  key: 'changedAt',
                  width: 180,
                  render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
                  sorter: (a, b) => b.changedAt.localeCompare(a.changedAt),
                  defaultSortOrder: 'ascend',
                },
                {
                  title: 'Type',
                  dataIndex: 'changeType',
                  key: 'changeType',
                  width: 100,
                  render: (type: string) => <Tag>{type.toUpperCase()}</Tag>,
                },
                {
                  title: 'Action',
                  dataIndex: 'action',
                  key: 'action',
                  width: 100,
                  render: (action: string) => {
                    const colors: Record<string, string> = {
                      create: 'green',
                      update: 'blue',
                      delete: 'red',
                      activate: 'cyan',
                      deactivate: 'orange',
                    };
                    return <Tag color={colors[action]}>{action.toUpperCase()}</Tag>;
                  },
                },
                {
                  title: 'Entity',
                  dataIndex: 'entityName',
                  key: 'entityName',
                },
                {
                  title: 'Summary',
                  dataIndex: 'changesSummary',
                  key: 'changesSummary',
                },
                {
                  title: 'Changed By',
                  dataIndex: 'changedBy',
                  key: 'changedBy',
                  width: 120,
                },
              ]}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* POLICY MODAL */}
      <Modal
        title={editingItem ? 'Edit Leave Policy' : 'Create Leave Policy'}
        open={policyModalVisible}
        onCancel={() => {
          setPolicyModalVisible(false);
          policyForm.resetFields();
        }}
        onOk={handleSavePolicy}
        width={800}
        okText="Save"
        confirmLoading={saving}
      >
        <Form form={policyForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Leave Type"
                name="leaveType"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select placeholder="Select leave type" disabled={!!editingItem}>
                  <Select.Option value="annual">Annual Leave</Select.Option>
                  <Select.Option value="sick">Sick Leave</Select.Option>
                  <Select.Option value="maternity">Maternity Leave</Select.Option>
                  <Select.Option value="paternity">Paternity Leave</Select.Option>
                  <Select.Option value="special">Special Leave</Select.Option>
                  <Select.Option value="study">Study Leave</Select.Option>
                  <Select.Option value="unpaid">Unpaid Leave</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Display Name"
                name="displayName"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="e.g., Annual Leave" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <TextArea rows={2} placeholder="Describe this leave type..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Is Statutory" name="isStatutory" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Is Paid" name="isPaid" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Is Active" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Statutory Reference" name="statutoryReference">
            <Input placeholder="e.g., s14A - Labour Act [Chapter 28:01]" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Accrual Method"
                name="accrualMethod"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select>
                  <Select.Option value="monthly">Monthly</Select.Option>
                  <Select.Option value="annual">Annual</Select.Option>
                  <Select.Option value="daily">Daily</Select.Option>
                  <Select.Option value="fixed">Fixed</Select.Option>
                  <Select.Option value="none">None</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Annual Entitlement (days)" name="annualEntitlementDays">
                <InputNumber min={0} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Max Accumulation (days)" name="maxAccumulationDays">
                <InputNumber min={0} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Requires Minimum Service" name="requiresMinimumService" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Minimum Service (days)" name="minimumServiceDays">
                <InputNumber min={0} max={3650} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Counts Weekends" name="countsWeekendsInLeave" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Counts Public Holidays" name="countsPublicHolidaysInLeave" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* WORKFLOW MODAL */}
      <Modal
        title={editingItem ? 'Edit Approval Workflow' : 'Create Approval Workflow'}
        open={workflowModalVisible}
        onCancel={() => {
          setWorkflowModalVisible(false);
          workflowForm.resetFields();
        }}
        onOk={handleSaveWorkflow}
        width={700}
        okText="Save"
        confirmLoading={saving}
      >
        <Form form={workflowForm} layout="vertical">
          <Form.Item
            label="Leave Type"
            name="leaveType"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select placeholder="Select leave type" disabled={!!editingItem}>
              {policies.map((policy) => (
                <Select.Option key={policy.leaveType} value={policy.leaveType}>
                  {policy.displayName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Workflow Name"
            name="displayName"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Annual Leave Approval" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={2} />
          </Form.Item>

          <Alert
            message="Approval Stages"
            description="Define the approval chain. Requests will flow through each stage in order."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.List name="stages">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card key={field.key} size="small" style={{ marginBottom: '8px' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          label="Stage Name"
                          name={[field.name, 'stageName']}
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input placeholder={`Stage ${index + 1}`} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          label="Approver Role"
                          name={[field.name, 'approverRole']}
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Select>
                            <Select.Option value="line-manager">Line Manager</Select.Option>
                            <Select.Option value="hr-manager">HR Manager</Select.Option>
                            <Select.Option value="department-head">Department Head</Select.Option>
                            <Select.Option value="ceo">CEO</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Button type="link" danger onClick={() => remove(field.name)}>
                      Remove Stage
                    </Button>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Stage
                </Button>
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item label="Is Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* HOLIDAY MODAL */}
      <Modal
        title={editingItem ? 'Edit Public Holiday' : 'Add Public Holiday'}
        open={holidayModalVisible}
        onCancel={() => {
          setHolidayModalVisible(false);
          holidayForm.resetFields();
        }}
        onOk={handleSaveHoliday}
        width={600}
        okText="Save"
        confirmLoading={saving}
      >
        <Form form={holidayForm} layout="vertical">
          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Required' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Holiday Name"
            name="name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Independence Day" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Is Recurring" name="isRecurring" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Affects Leave Calculation" name="affectsLeaveCalculation" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Optional notes about this holiday..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
