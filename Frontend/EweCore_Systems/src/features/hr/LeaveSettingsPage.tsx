/**
 * Unified Leave Settings Page
 *
 * Comprehensive leave system configuration with 7 tabs:
 * 1. Leave Policies - Policy configuration + entitlements + gender restrictions + documentation
 * 2. Approval Workflows - Multi-approver support + unlimited stages + position/specific approvers
 * 3. Working Hours & Holidays - Work schedule + Zimbabwe public holidays
 * 4. Eligibility & Validation - Service requirements + gender rules + probation
 * 5. Notifications & Calendar - Email alerts + calendar display preferences
 * 6. Leave Year & Balances - Fiscal year + carryforward + negative balance rules
 * 7. Approval Groups - Custom approval groups for flexible workflow assignment
 *
 * Features:
 * - Direct API integration (no Zustand)
 * - Multi-approver workflows (any one / all must approve)
 * - Unlimited workflow stages with Form.List
 * - Configuration-driven leave system
 * - Zimbabwe Labour Act compliance
 * - Approval groups for flexible organizational structure
 */

import { useState, useEffect } from 'react';
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
  TimePicker,
  Alert,
  message,
  Divider,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Checkbox,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  FileProtectOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  BellOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  GlobalOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { PageHeader } from '../../components/common';
import { DragDropMemberManager } from '../../components/common/DragDropMemberManager';
import { useAuthStore } from '../../store/authStore';
import employeeApi from '../../services/api/employeeApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LeavePolicy {
  id: string;
  code: string;
  leave_type: string;
  display_name: string;
  description: string;

  // Statutory
  is_statutory: boolean;
  statutory_reference?: string;

  // Payment
  is_paid: boolean;
  pay_status: string;

  // Accrual
  accrual_method: string;
  annual_entitlement_days: number;
  max_accumulation_days?: number;

  // Eligibility
  requires_minimum_service: boolean;
  minimum_service_days: number;
  available_during_probation: boolean;
  gender_restriction: 'male' | 'female' | 'none';

  // Documentation
  requires_documentation: boolean;
  documentation_types: string[];
  documentation_mandatory: boolean;

  // Approval
  requires_manager_approval: boolean;
  requires_hr_approval: boolean;
  requires_ceo_approval: boolean;

  // Calculation
  counts_weekends_in_leave: boolean;
  counts_public_holidays_in_leave: boolean;

  // Carryforward
  allow_carry_forward: boolean;
  carry_forward_max_days?: number;

  // Notice
  minimum_notice_days: number;

  // Other
  supports_half_days: boolean;
  is_active: boolean;
}

interface ApprovalWorkflow {
  id: string;
  workflow_name: string;
  description?: string;
  workflow_type: string;
  stages: ApprovalStage[];
  is_active: boolean;
  conditions?: any;
}

interface ApprovalStage {
  stage_number: number;
  stage_name: string;
  approver_type: 'position' | 'specific' | 'department_head' | 'role';
  action_type?: 'certify' | 'recommend' | 'approve' | 'review';
  approver_position?: string;
  approver_employee_ids: string[];
  approval_logic: 'any' | 'all';
  is_required: boolean;
  auto_approve_conditions?: any;
}

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  is_recurring: boolean;
  is_active: boolean;
  notes?: string;
}

interface WorkingHours {
  id: string;
  name: string;
  monday_working: boolean;
  tuesday_working: boolean;
  wednesday_working: boolean;
  thursday_working: boolean;
  friday_working: boolean;
  saturday_working: boolean;
  sunday_working: boolean;
  work_start_time: string;
  work_end_time: string;
  lunch_break_duration: number;
  total_work_hours_per_day: number;
  is_default: boolean;
  is_active: boolean;
}

interface ApprovalGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  group_type: 'department' | 'role' | 'custom' | 'project';
  department?: string;
  department_name?: string;
  member_count?: number;
  memberships?: ApprovalGroupMembership[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApprovalGroupMembership {
  id: string;
  approval_group: string;
  employee: string;
  employee_name?: string;
  employee_number?: string;
  department?: string;
  role: 'member' | 'lead' | 'admin';
  joined_at: string;
  is_active: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LeaveSettingsPage = () => {
  const { user } = useAuthStore();

  // Tab state
  const [activeTab, setActiveTab] = useState('1');

  // Data state
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [approvalGroups, setApprovalGroups] = useState<ApprovalGroup[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [workingHoursModalVisible, setWorkingHoursModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [manageMembersVisible, setManageMembersVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<ApprovalGroup | null>(null);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<ApprovalGroup | null>(null);
  const [allEmployeesWithGroups, setAllEmployeesWithGroups] = useState<any[]>([]);

  // Forms
  const [policyForm] = Form.useForm();
  const [workflowForm] = Form.useForm();
  const [holidayForm] = Form.useForm();
  const [workingHoursForm] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [calendarForm] = Form.useForm();
  const [leaveYearForm] = Form.useForm();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPolicies(),
        fetchWorkflows(),
        fetchHolidays(),
        fetchWorkingHours(),
        fetchApprovalGroups(),
        fetchEmployees(),
        fetchDepartments(),
        fetchEmployeesWithGroups(),
        fetchLeaveYearConfig(),
        fetchNotificationSettings(),
        fetchCalendarSettings(),
      ]);
    } catch (error) {
      console.error('Failed to fetch settings data:', error);
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await employeeApi.leavePolicies.list({ is_active: true });
      setPolicies(response.results || []);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await employeeApi.approvalWorkflows.list({ workflow_type: 'leave' });
      setWorkflows(response.results || []);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await employeeApi.publicHolidays.list({ is_active: true });
      setHolidays(response.results || []);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
    }
  };

  const fetchWorkingHours = async () => {
    try {
      const response = await employeeApi.workingHours.list({ is_active: true });
      setWorkingHours(response.results || []);
    } catch (error) {
      console.error('Failed to fetch working hours:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeApi.employees.list({ page_size: 1000, is_active: true });
      setEmployees(response.results || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await employeeApi.departments.list({ page_size: 1000, is_active: true });
      setDepartments(response.results || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchApprovalGroups = async () => {
    try {
      const response = await employeeApi.approvalGroups.list({ page_size: 1000 });
      setApprovalGroups(response.results || []);
    } catch (error) {
      console.error('Failed to fetch approval groups:', error);
    }
  };

  const fetchEmployeesWithGroups = async () => {
    try {
      const data = await employeeApi.approvalGroups.getEmployeeGroups();
      setAllEmployeesWithGroups(data);
    } catch (error) {
      console.error('Failed to fetch employees with groups:', error);
    }
  };

  const fetchLeaveYearConfig = async () => {
    try {
      const config = await employeeApi.leaveYearConfig.get();
      if (config) {
        leaveYearForm.setFieldsValue({
          leaveYearType: config.leave_year_type,
          financialYearStart: config.financial_year_start,
          autoCarryForward: config.auto_carry_forward,
          allowNegativeBalance: config.allow_negative_balance,
          maxNegativeBalanceDays: config.max_negative_balance_days,
        });
      }
    } catch (error) {
      console.error('Failed to fetch leave year config:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const settings = await employeeApi.leaveNotificationSettings.get();
      if (settings) {
        notificationForm.setFieldsValue({
          notifyOnSubmission: settings.notify_on_submission,
          notifyOnApproval: settings.notify_on_approval,
          notifyOnRejection: settings.notify_on_rejection,
          reminderDaysBeforeLeave: settings.reminder_days_before_leave,
        });
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    }
  };

  const fetchCalendarSettings = async () => {
    try {
      const settings = await employeeApi.leaveCalendarSettings.get();
      if (settings) {
        calendarForm.setFieldsValue({
          defaultView: settings.default_view,
          weekStartsOn: settings.week_starts_on,
          showWeekendsOnCalendar: settings.show_weekends_on_calendar,
          highlightPublicHolidays: settings.highlight_public_holidays,
        });
      }
    } catch (error) {
      console.error('Failed to fetch calendar settings:', error);
    }
  };

  // ============================================================================
  // POLICY MANAGEMENT (TAB 1)
  // ============================================================================

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

      if (editingItem) {
        await employeeApi.leavePolicies.update(editingItem.id, values);
        message.success('Leave policy updated successfully');
      } else {
        await employeeApi.leavePolicies.create(values);
        message.success('Leave policy created successfully');
      }

      setPolicyModalVisible(false);
      policyForm.resetFields();
      fetchPolicies();
    } catch (error: any) {
      console.error('Failed to save policy:', error);
      message.error(error?.response?.data?.detail || 'Failed to save policy');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await employeeApi.leavePolicies.delete(policyId);
      message.success('Policy deleted successfully');
      fetchPolicies();
    } catch (error: any) {
      console.error('Failed to delete policy:', error);
      message.error(error?.response?.data?.detail || 'Failed to delete policy');
    }
  };

  const policyColumns: ColumnsType<LeavePolicy> = [
    {
      title: 'Leave Type',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text: string, record: LeavePolicy) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{text}</Text>
            {record.is_statutory && (
              <Tag color="blue" icon={<FileProtectOutlined />}>
                Statutory
              </Tag>
            )}
          </Space>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Entitlement',
      dataIndex: 'annual_entitlement_days',
      key: 'annual_entitlement_days',
      width: 120,
      render: (days: number) => `${days} days`,
    },
    {
      title: 'Gender',
      dataIndex: 'gender_restriction',
      key: 'gender_restriction',
      width: 100,
      render: (restriction: string) => {
        if (restriction === 'none') return <Tag>All</Tag>;
        if (restriction === 'female') return <Tag color="pink">Female Only</Tag>;
        if (restriction === 'male') return <Tag color="blue">Male Only</Tag>;
        return <Tag>All</Tag>;
      },
    },
    {
      title: 'Paid',
      dataIndex: 'is_paid',
      key: 'is_paid',
      width: 80,
      render: (isPaid: boolean) => (
        <Tag color={isPaid ? 'green' : 'red'}>{isPaid ? 'PAID' : 'UNPAID'}</Tag>
      ),
    },
    {
      title: 'Notice',
      dataIndex: 'minimum_notice_days',
      key: 'minimum_notice_days',
      width: 100,
      render: (days: number) => `${days} days`,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
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
          {!record.is_statutory && (
            <Popconfirm
              title="Delete Policy"
              description="Are you sure? This cannot be undone."
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

  // ============================================================================
  // WORKFLOW MANAGEMENT (TAB 2 - MULTI-APPROVER SUPPORT)
  // ============================================================================

  const handleCreateWorkflow = () => {
    setEditingItem(null);
    workflowForm.resetFields();
    workflowForm.setFieldsValue({
      workflow_type: 'leave',
      is_active: true,
      stages: [{
        stage_number: 1,
        stage_name: 'Stage 1',
        approver_type: 'specific',
        action_type: 'approve',
        approver_employee_ids: [],
        approval_logic: 'any',
        is_required: true,
      }],
    });
    setWorkflowModalVisible(true);
  };

  const handleEditWorkflow = (workflow: ApprovalWorkflow) => {
    setEditingItem(workflow);
    workflowForm.setFieldsValue(workflow);
    setWorkflowModalVisible(true);
  };

  const handleSaveWorkflow = async () => {
    try {
      const values = await workflowForm.validateFields();

      // Auto-assign stage numbers
      const stages = values.stages.map((stage: any, index: number) => ({
        ...stage,
        stage_number: index + 1,
      }));

      const workflowData = {
        ...values,
        stages,
        workflow_type: 'leave',
      };

      if (editingItem) {
        await employeeApi.approvalWorkflows.update(editingItem.id, workflowData);
        message.success('Workflow updated successfully');
      } else {
        await employeeApi.approvalWorkflows.create(workflowData);
        message.success('Workflow created successfully');
      }

      setWorkflowModalVisible(false);
      workflowForm.resetFields();
      fetchWorkflows();
    } catch (error: any) {
      console.error('Failed to save workflow:', error);
      message.error(error?.response?.data?.detail || 'Failed to save workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await employeeApi.approvalWorkflows.delete(workflowId);
      message.success('Workflow deleted successfully');
      fetchWorkflows();
    } catch (error: any) {
      console.error('Failed to delete workflow:', error);
      message.error(error?.response?.data?.detail || 'Failed to delete workflow');
    }
  };

  const workflowColumns: ColumnsType<ApprovalWorkflow> = [
    {
      title: 'Workflow Name',
      dataIndex: 'workflow_name',
      key: 'workflow_name',
      render: (text: string, record: ApprovalWorkflow) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Stages',
      dataIndex: 'stages',
      key: 'stages',
      width: 80,
      render: (stages: ApprovalStage[]) => `${stages?.length || 0} stages`,
    },
    {
      title: 'Approval Chain',
      dataIndex: 'stages',
      key: 'chain',
      render: (stages: ApprovalStage[]) => (
        <Space size={4} wrap>
          {stages?.map((stage, i) => {
            const actionTypeColors: Record<string, string> = {
              certify: 'blue',
              recommend: 'cyan',
              approve: 'green',
              review: 'orange',
            };
            const actionType = stage.action_type || 'approve';
            const actionLabel = actionType.charAt(0).toUpperCase() + actionType.slice(1);

            return (
              <Tag key={i} color={actionTypeColors[actionType]} style={{ margin: '2px' }}>
                {actionLabel}
                {stage.approval_logic === 'any' && stage.approver_employee_ids?.length > 1 && (
                  <Text style={{ fontSize: '10px', opacity: 0.8 }}> (any)</Text>
                )}
                {stage.approval_logic === 'all' && stage.approver_employee_ids?.length > 1 && (
                  <Text style={{ fontSize: '10px', opacity: 0.8 }}> (all)</Text>
                )}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: 'Applies to Group',
      key: 'applicable_group',
      width: 150,
      render: (_: any, record: ApprovalWorkflow) => {
        const groupId = (record as any).applicable_groups?.[0];
        const group = approvalGroups.find(g => g.id === groupId);
        return group ? (
          <Tag color="blue" icon={<TeamOutlined />}>
            {group.name}
          </Tag>
        ) : (
          <Tag color="default">No group</Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
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
      render: (_: any, record: ApprovalWorkflow) => (
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

  // ============================================================================
  // HOLIDAY MANAGEMENT (TAB 3)
  // ============================================================================

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
      };

      if (editingItem) {
        await employeeApi.publicHolidays.update(editingItem.id, formattedValues);
        message.success('Holiday updated successfully');
      } else {
        await employeeApi.publicHolidays.create(formattedValues);
        message.success('Holiday created successfully');
      }

      setHolidayModalVisible(false);
      holidayForm.resetFields();
      fetchHolidays();
    } catch (error: any) {
      console.error('Failed to save holiday:', error);
      message.error(error?.response?.data?.detail || 'Failed to save holiday');
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      await employeeApi.publicHolidays.delete(holidayId);
      message.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (error: any) {
      console.error('Failed to delete holiday:', error);
      message.error(error?.response?.data?.detail || 'Failed to delete holiday');
    }
  };

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
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Recurring',
      dataIndex: 'is_recurring',
      key: 'is_recurring',
      width: 100,
      render: (isRecurring: boolean) => (
        <Tag color={isRecurring ? 'blue' : 'default'}>
          {isRecurring ? 'YES' : 'NO'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
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

  // ============================================================================
  // WORKING HOURS MANAGEMENT
  // ============================================================================

  const handleCreateWorkingHours = () => {
    setEditingItem(null);
    workingHoursForm.resetFields();
    setWorkingHoursModalVisible(true);
  };

  const handleEditWorkingHours = (wh: WorkingHours) => {
    setEditingItem(wh);
    workingHoursForm.setFieldsValue({
      ...wh,
      work_start_time: dayjs(wh.work_start_time, 'HH:mm:ss'),
      work_end_time: dayjs(wh.work_end_time, 'HH:mm:ss'),
    });
    setWorkingHoursModalVisible(true);
  };

  const handleSaveWorkingHours = async () => {
    try {
      const values = await workingHoursForm.validateFields();
      const formattedValues = {
        ...values,
        work_start_time: values.work_start_time.format('HH:mm:ss'),
        work_end_time: values.work_end_time.format('HH:mm:ss'),
      };

      if (editingItem) {
        await employeeApi.workingHours.update(editingItem.id, formattedValues);
        message.success('Working hours updated successfully');
      } else {
        await employeeApi.workingHours.create(formattedValues);
        message.success('Working hours created successfully');
      }

      setWorkingHoursModalVisible(false);
      workingHoursForm.resetFields();
      fetchWorkingHours();
    } catch (error: any) {
      console.error('Failed to save working hours:', error);
      message.error(error?.response?.data?.detail || 'Failed to save working hours');
    }
  };

  // ============================================================================
  // LEAVE SETTINGS MANAGEMENT (TAB 5 & 6)
  // ============================================================================

  const handleSaveNotificationSettings = async (values: any) => {
    try {
      const data = {
        notify_on_submission: values.notifyOnSubmission,
        notify_on_approval: values.notifyOnApproval,
        notify_on_rejection: values.notifyOnRejection,
        reminder_days_before_leave: values.reminderDaysBeforeLeave,
      };

      await employeeApi.leaveNotificationSettings.update(data);
      message.success('Notification settings saved successfully');
      fetchNotificationSettings();
    } catch (error: any) {
      console.error('Failed to save notification settings:', error);
      message.error(error?.response?.data?.detail || 'Failed to save notification settings');
    }
  };

  const handleSaveCalendarSettings = async (values: any) => {
    try {
      const data = {
        default_view: values.defaultView,
        week_starts_on: values.weekStartsOn,
        show_weekends_on_calendar: values.showWeekendsOnCalendar,
        highlight_public_holidays: values.highlightPublicHolidays,
      };

      await employeeApi.leaveCalendarSettings.update(data);
      message.success('Calendar settings saved successfully');
      fetchCalendarSettings();
    } catch (error: any) {
      console.error('Failed to save calendar settings:', error);
      message.error(error?.response?.data?.detail || 'Failed to save calendar settings');
    }
  };

  const handleSaveLeaveYearConfig = async (values: any) => {
    try {
      const data = {
        leave_year_type: values.leaveYearType,
        financial_year_start: values.financialYearStart,
        auto_carry_forward: values.autoCarryForward,
        allow_negative_balance: values.allowNegativeBalance,
        max_negative_balance_days: values.maxNegativeBalanceDays,
      };

      await employeeApi.leaveYearConfig.update(data);
      message.success('Leave year settings saved successfully');
      fetchLeaveYearConfig();
    } catch (error: any) {
      console.error('Failed to save leave year config:', error);
      message.error(error?.response?.data?.detail || 'Failed to save leave year configuration');
    }
  };

  // ============================================================================
  // APPROVAL GROUP MANAGEMENT (TAB 7)
  // ============================================================================

  const handleCreateGroup = () => {
    setEditingItem(null);
    groupForm.resetFields();
    groupForm.setFieldsValue({
      is_active: true,
      group_type: 'custom',
    });
    setGroupModalVisible(true);
  };

  const handleEditGroup = (group: ApprovalGroup) => {
    setEditingItem(group);
    groupForm.setFieldsValue(group);
    setGroupModalVisible(true);
  };

  const handleSaveGroup = async () => {
    try {
      const values = await groupForm.validateFields();

      if (editingItem) {
        await employeeApi.approvalGroups.update(editingItem.id, values);
        message.success('Approval group updated successfully');
      } else {
        await employeeApi.approvalGroups.create(values);
        message.success('Approval group created successfully');
      }

      setGroupModalVisible(false);
      groupForm.resetFields();
      fetchApprovalGroups();
    } catch (error: any) {
      console.error('Failed to save approval group:', error);
      message.error(error?.response?.data?.detail || 'Failed to save approval group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await employeeApi.approvalGroups.delete(groupId);
      message.success('Approval group deleted successfully');
      fetchApprovalGroups();
    } catch (error: any) {
      console.error('Failed to delete approval group:', error);
      message.error(error?.response?.data?.detail || 'Failed to delete approval group');
    }
  };

  const handleAddMember = (group: ApprovalGroup) => {
    setSelectedGroup(group);
    memberForm.resetFields();
    memberForm.setFieldsValue({ role: 'member' });
    setMemberModalVisible(true);
  };

  const handleSaveMember = async () => {
    try {
      const values = await memberForm.validateFields();

      if (!selectedGroup) return;

      await employeeApi.approvalGroups.addMember(
        selectedGroup.id,
        values.employee_id,
        values.role
      );

      message.success('Member added successfully');
      setMemberModalVisible(false);
      memberForm.resetFields();
      fetchApprovalGroups();
    } catch (error: any) {
      console.error('Failed to add member:', error);
      message.error(error?.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (groupId: string, employeeId: string) => {
    try {
      await employeeApi.approvalGroups.removeMember(groupId, employeeId);
      message.success('Member removed successfully');
      fetchApprovalGroups();
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      message.error(error?.response?.data?.detail || 'Failed to remove member');
    }
  };

  // New handlers for drag-and-drop member management
  const handleManageMembers = (group: ApprovalGroup) => {
    setSelectedGroupForMembers(group);
    setManageMembersVisible(true);
  };

  const handleSaveMembers = async (addedMembers: any[], removedMemberIds: string[]) => {
    if (!selectedGroupForMembers) return;

    try {
      // Remove members first
      for (const memberId of removedMemberIds) {
        await employeeApi.approvalGroups.removeMember(selectedGroupForMembers.id, memberId);
      }

      // Add members
      for (const member of addedMembers) {
        await employeeApi.approvalGroups.addMember(
          selectedGroupForMembers.id,
          member.id,
          member.role
        );
      }

      // Refresh data
      await fetchApprovalGroups();
      await fetchEmployeesWithGroups();
    } catch (error: any) {
      console.error('Failed to save members:', error);
      throw error; // Let the component handle the error message
    }
  };

  const groupColumns: ColumnsType<ApprovalGroup> = [
    {
      title: 'Group Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Group Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ApprovalGroup) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 120,
      render: (count: number) => (
        <Tag icon={<TeamOutlined />} color="cyan">
          {count || 0} members
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
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
      width: 250,
      render: (_: any, record: ApprovalGroup) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => handleManageMembers(record)}
          >
            Manage Members
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditGroup(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Approval Group"
            description="Are you sure? This may affect existing workflows."
            onConfirm={() => handleDeleteGroup(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const memberColumns: ColumnsType<ApprovalGroupMembership> = [
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (name: string, record: ApprovalGroupMembership) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee_number}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => dept || <Text type="secondary">-</Text>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const colorMap: any = {
          admin: 'red',
          lead: 'orange',
          member: 'blue',
        };
        return <Tag color={colorMap[role] || 'default'}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Joined',
      dataIndex: 'joined_at',
      key: 'joined_at',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
  ];

  // ============================================================================
  // TAB CONTENT
  // ============================================================================

  const Tab1_LeavePolicies = (
    <div>
      <Alert
        title="Leave Policy Configuration"
        description="Configure leave types, entitlements, accrual rates, gender restrictions, documentation requirements, and eligibility rules. Statutory leave types are mandated by Zimbabwe Labour Act."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <div style={{ marginBottom: '16px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreatePolicy}
        >
          Create Leave Policy
        </Button>
      </div>

      <Table
        columns={policyColumns}
        dataSource={policies}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const Tab2_ApprovalWorkflows = (
    <div>
      <Alert
        title="Multi-Approver Approval Workflows"
        description="Configure approval chains for leave requests. Support for multiple approvers per stage (any one can approve OR all must approve), unlimited stages, position-based or specific approvers. Sensitive leave types can have custom routing."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

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
        dataSource={workflows}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const Tab3_WorkingHoursAndHolidays = (
    <div>
      <Alert
        title="Working Hours & Public Holidays"
        description="Configure standard working hours, working days, and Zimbabwe public holidays. These settings affect leave day calculations and working day counts."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Public Holidays" extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateHoliday}>
              Add Holiday
            </Button>
          }>
            <Table
              columns={holidayColumns}
              dataSource={holidays}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Working Hours Configuration" extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateWorkingHours}>
              Add Configuration
            </Button>
          }>
            <Table
              dataSource={workingHours}
              rowKey="id"
              loading={loading}
              pagination={false}
              columns={[
                { title: 'Configuration Name', dataIndex: 'name', key: 'name' },
                {
                  title: 'Working Days',
                  key: 'working_days',
                  render: (_, record: WorkingHours) => {
                    const days = [];
                    if (record.monday_working) days.push('Mon');
                    if (record.tuesday_working) days.push('Tue');
                    if (record.wednesday_working) days.push('Wed');
                    if (record.thursday_working) days.push('Thu');
                    if (record.friday_working) days.push('Fri');
                    if (record.saturday_working) days.push('Sat');
                    if (record.sunday_working) days.push('Sun');
                    return days.join(', ');
                  },
                },
                {
                  title: 'Hours',
                  key: 'hours',
                  render: (_, record: WorkingHours) => (
                    `${record.work_start_time} - ${record.work_end_time} (${record.total_work_hours_per_day}h/day)`
                  ),
                },
                {
                  title: 'Default',
                  dataIndex: 'is_default',
                  key: 'is_default',
                  render: (isDefault: boolean) => (
                    isDefault ? <Tag color="blue">DEFAULT</Tag> : null
                  ),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record: WorkingHours) => (
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditWorkingHours(record)}
                    >
                      Edit
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const Tab4_EligibilityAndValidation = (
    <div>
      <Alert
        title="Eligibility & Validation Rules"
        description="Eligibility rules are configured per leave policy in Tab 1 (minimum service, gender restrictions, probation availability). This tab is reserved for future advanced rule configurations."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="Eligibility Rules Summary">
        <Paragraph>
          Current eligibility rules are configured at the leave policy level:
        </Paragraph>
        <ul>
          <li><strong>Minimum Service:</strong> Set per leave type (e.g., Annual Leave requires 1 year)</li>
          <li><strong>Gender Restrictions:</strong> Maternity (female only), Paternity (male only)</li>
          <li><strong>Probation Availability:</strong> Some leave types unavailable during probation</li>
          <li><strong>Documentation:</strong> Required document types per leave policy</li>
        </ul>

        <Divider />

        <Title level={5}>Active Policies with Gender Restrictions</Title>
        <Table
          size="small"
          dataSource={policies.filter(p => p.gender_restriction !== 'none')}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Leave Type', dataIndex: 'display_name', key: 'display_name' },
            {
              title: 'Gender Restriction',
              dataIndex: 'gender_restriction',
              key: 'gender_restriction',
              render: (restriction: string) => (
                <Tag color={restriction === 'female' ? 'pink' : 'blue'}>
                  {restriction.toUpperCase()} ONLY
                </Tag>
              ),
            },
            {
              title: 'Minimum Service',
              dataIndex: 'minimum_service_days',
              key: 'minimum_service_days',
              render: (days: number) => `${days} days`,
            },
          ]}
        />
      </Card>
    </div>
  );

  const Tab5_NotificationsAndCalendar = (
    <div>
      <Alert
        title="Notifications & Calendar Display"
        description="Configure email and in-app notifications for leave requests, approvals, and reminders. Customize calendar display settings."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card title="Notification Settings">
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleSaveNotificationSettings}
              initialValues={{
                notifyOnSubmission: true,
                notifyOnApproval: true,
                notifyOnRejection: true,
                reminderDaysBeforeLeave: 3,
              }}
            >
              <Form.Item name="notifyOnSubmission" valuePropName="checked">
                <Checkbox>Notify employee on leave submission</Checkbox>
              </Form.Item>
              <Form.Item name="notifyOnApproval" valuePropName="checked">
                <Checkbox>Notify employee on approval</Checkbox>
              </Form.Item>
              <Form.Item name="notifyOnRejection" valuePropName="checked">
                <Checkbox>Notify employee on rejection</Checkbox>
              </Form.Item>
              <Form.Item
                label="Reminder Days Before Leave"
                name="reminderDaysBeforeLeave"
              >
                <InputNumber min={0} max={90} style={{ width: '100%' }} />
              </Form.Item>

              <Button type="primary" htmlType="submit">
                Save Notification Settings
              </Button>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Calendar Display Settings">
            <Form
              form={calendarForm}
              layout="vertical"
              onFinish={handleSaveCalendarSettings}
              initialValues={{
                defaultView: 'month',
                weekStartsOn: 1,
                showWeekendsOnCalendar: true,
                highlightPublicHolidays: true,
              }}
            >
              <Form.Item label="Default View" name="defaultView">
                <Select>
                  <Option value="month">Month View</Option>
                  <Option value="week">Week View</Option>
                  <Option value="day">Day View</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Week Starts On" name="weekStartsOn">
                <Select>
                  <Option value={0}>Sunday</Option>
                  <Option value={1}>Monday</Option>
                </Select>
              </Form.Item>
              <Form.Item name="showWeekendsOnCalendar" valuePropName="checked">
                <Checkbox>Show weekends on calendar</Checkbox>
              </Form.Item>
              <Form.Item name="highlightPublicHolidays" valuePropName="checked">
                <Checkbox>Highlight public holidays</Checkbox>
              </Form.Item>

              <Button type="primary" htmlType="submit">
                Save Calendar Settings
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const Tab6_LeaveYearAndBalances = (
    <div>
      <Alert
        title="Leave Year & Balance Configuration"
        description="Configure when your leave year starts (calendar/financial/anniversary-based), carryforward processing, and balance rules including negative balance allowances."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="Leave Year Settings">
        <Form
          form={leaveYearForm}
          layout="vertical"
          onFinish={handleSaveLeaveYearConfig}
          initialValues={{
            leaveYearType: 'financial',
            financialYearStart: '04-01',
            autoCarryForward: true,
            allowNegativeBalance: false,
            maxNegativeBalanceDays: 0,
          }}
        >
          <Form.Item label="Leave Year Type" name="leaveYearType">
            <Select>
              <Option value="calendar">Calendar Year (Jan 1 - Dec 31)</Option>
              <Option value="financial">Financial Year (Apr 1 - Mar 31 - Zimbabwe)</Option>
              <Option value="anniversary">Anniversary-based (per employee)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Financial Year Start Date"
            name="financialYearStart"
            tooltip="Zimbabwe financial year starts April 1"
          >
            <Input placeholder="MM-DD (e.g., 04-01)" />
          </Form.Item>

          <Divider>Carryforward Rules</Divider>

          <Form.Item name="autoCarryForward" valuePropName="checked">
            <Checkbox>Automatically carry forward unused leave at year end</Checkbox>
          </Form.Item>

          <Divider>Balance Rules</Divider>

          <Form.Item name="allowNegativeBalance" valuePropName="checked">
            <Checkbox>Allow negative leave balance (advance leave)</Checkbox>
          </Form.Item>

          <Form.Item
            label="Maximum Negative Balance (days)"
            name="maxNegativeBalanceDays"
            tooltip="How many days can employees borrow in advance"
          >
            <InputNumber min={0} max={30} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Leave Year Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const Tab7_ApprovalGroups = (
    <div>
      <Alert
        title="Approval Group Management"
        description="Create custom approval groups (e.g., Executive, Management, Employees) for flexible workflow assignment. Each group can have its own workflow, and members from one group can approve for another group. This solves the issue of departments with only one employee."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <div style={{ marginBottom: '16px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateGroup}
        >
          Create Approval Group
        </Button>
      </div>

      <Table
        columns={groupColumns}
        dataSource={approvalGroups}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '16px 24px', background: '#f5f5f5' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Group Members ({record.memberships?.length || 0})</Text>
              </div>

              {record.memberships && record.memberships.length > 0 ? (
                <Table
                  columns={[
                    ...memberColumns,
                    {
                      title: 'Actions',
                      key: 'actions',
                      width: 120,
                      render: (_: any, member: ApprovalGroupMembership) => (
                        <Popconfirm
                          title="Remove Member"
                          description="Are you sure you want to remove this member?"
                          onConfirm={() => handleRemoveMember(record.id, member.employee)}
                        >
                          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            Remove
                          </Button>
                        </Popconfirm>
                      ),
                    },
                  ]}
                  dataSource={record.memberships}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <Alert
                  message="No members yet"
                  description="Click 'Add Member' to add employees to this group."
                  type="warning"
                  showIcon
                />
              )}
            </div>
          ),
          rowExpandable: (record) => true,
        }}
      />
    </div>
  );

  // ============================================================================
  // MODALS
  // ============================================================================

  const PolicyModal = (
    <Modal
      title={editingItem ? 'Edit Leave Policy' : 'Create Leave Policy'}
      open={policyModalVisible}
      onCancel={() => {
        setPolicyModalVisible(false);
        policyForm.resetFields();
      }}
      onOk={handleSavePolicy}
      width={900}
      okText="Save"
    >
      <Form form={policyForm} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Leave Type Code"
              name="code"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., POLICY-ANNUAL-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Leave Type"
              name="leave_type"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select placeholder="Select leave type">
                <Option value="annual">Annual Leave</Option>
                <Option value="sick">Sick Leave</Option>
                <Option value="maternity">Maternity Leave</Option>
                <Option value="paternity">Paternity Leave</Option>
                <Option value="special">Special Leave</Option>
                <Option value="study">Study Leave</Option>
                <Option value="unpaid">Unpaid Leave</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Display Name"
          name="display_name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g., Annual / Vacation Leave" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={2} placeholder="Describe this leave type..." />
        </Form.Item>

        <Divider>Statutory & Payment</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Is Statutory" name="is_statutory" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Is Paid" name="is_paid" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Is Active" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Statutory Reference" name="statutory_reference">
          <Input placeholder="e.g., s14A - Labour Act [Chapter 28:01]" />
        </Form.Item>

        <Divider>Entitlement & Accrual</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Accrual Method"
              name="accrual_method"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select>
                <Option value="monthly">Monthly</Option>
                <Option value="annual">Annual</Option>
                <Option value="fixed">Fixed</Option>
                <Option value="none">None</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Annual Entitlement (days)"
              name="annual_entitlement_days"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={365} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Max Accumulation (days)" name="max_accumulation_days">
              <InputNumber min={0} max={365} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Eligibility & Gender Restrictions</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Gender Restriction"
              name="gender_restriction"
              tooltip="Restrict leave to specific gender (e.g., Maternity = female only)"
            >
              <Select>
                <Option value="none">No Restriction (All Genders)</Option>
                <Option value="female">Female Only</Option>
                <Option value="male">Male Only</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Minimum Service (days)" name="minimum_service_days">
              <InputNumber min={0} max={3650} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Requires Minimum Service" name="requires_minimum_service" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Available During Probation" name="available_during_probation" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Documentation Requirements</Divider>

        <Form.Item label="Requires Documentation" name="requires_documentation" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Documentation Types (comma-separated)" name="documentation_types">
          <Select mode="tags" placeholder="e.g., medical-certificate, death-certificate">
            <Option value="medical-certificate">Medical Certificate</Option>
            <Option value="death-certificate">Death Certificate</Option>
            <Option value="marriage-certificate">Marriage Certificate</Option>
            <Option value="birth-certificate">Birth Certificate</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Documentation Mandatory" name="documentation_mandatory" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Divider>Leave Calculation</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Counts Weekends" name="counts_weekends_in_leave" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Counts Public Holidays" name="counts_public_holidays_in_leave" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Supports Half Days" name="supports_half_days" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Carryforward & Notice</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Allow Carryforward" name="allow_carry_forward" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Max Carryforward (days)" name="carry_forward_max_days">
              <InputNumber min={0} max={365} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Minimum Notice (days)"
              name="minimum_notice_days"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={90} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );

  const WorkflowModal = (
    <Modal
      title={editingItem ? 'Edit Approval Workflow' : 'Create Approval Workflow'}
      open={workflowModalVisible}
      onCancel={() => {
        setWorkflowModalVisible(false);
        workflowForm.resetFields();
      }}
      onOk={handleSaveWorkflow}
      width={900}
      okText="Save"
    >
      <Form form={workflowForm} layout="vertical">
        <Form.Item
          label="Workflow Name"
          name="workflow_name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g., Annual Leave Approval Workflow" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={2} placeholder="Describe this workflow..." />
        </Form.Item>

        <Form.Item label="Is Active" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item
          label="Applies to Group"
          name="applicable_group_id"
          tooltip="This workflow applies only to employees in the selected approval group"
          rules={[{ required: true, message: 'Please select which approval group this workflow applies to' }]}
        >
          <Select
            placeholder="Select approval group"
            showSearch
            filterOption={(input, option: any) =>
              option?.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {approvalGroups.map((group) => (
              <Option key={group.id} value={group.id}>
                {group.name} ({group.code}) - {group.member_count} members
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Approval Stages (Support Multi-Approvers)</Divider>

        <Alert
          title="Multi-Approver Workflow"
          description={
            <div>
              <p><strong>Create unlimited approval stages.</strong> For each stage:</p>
              <ul>
                <li><strong>Select specific employees</strong> who can approve (from any approval group)</li>
                <li><strong>Approval Logic:</strong>
                  <ul>
                    <li><strong>"Any One"</strong> - Any ONE approver can approve (for redundancy/flexibility)</li>
                    <li><strong>"All Must Approve"</strong> - ALL selected approvers must approve (for critical decisions)</li>
                  </ul>
                </li>
              </ul>
              <p><strong>Example:</strong> Employee Leave → Stage 1: Collen OR David (any) → Stage 2: Margaret (CEO)</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

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
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {employees.map((emp: any) => (
                            <Option key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name} - {emp.department?.name || 'No Dept'}
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

                  <Form.Item
                    {...field}
                    label="Is Required Stage"
                    name={[field.name, 'is_required']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Card>
              ))}

              <Button
                type="dashed"
                onClick={() => add({
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
  );

  const HolidayModal = (
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
    >
      <Form form={holidayForm} layout="vertical">
        <Form.Item
          label="Holiday Name"
          name="name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g., Independence Day" />
        </Form.Item>

        <Form.Item
          label="Date"
          name="date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Is Recurring" name="is_recurring" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Is Active" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Notes" name="notes">
          <TextArea rows={3} placeholder="Optional notes..." />
        </Form.Item>
      </Form>
    </Modal>
  );

  const WorkingHoursModal = (
    <Modal
      title={editingItem ? 'Edit Working Hours' : 'Add Working Hours Configuration'}
      open={workingHoursModalVisible}
      onCancel={() => {
        setWorkingHoursModalVisible(false);
        workingHoursForm.resetFields();
      }}
      onOk={handleSaveWorkingHours}
      width={700}
      okText="Save"
    >
      <Form form={workingHoursForm} layout="vertical">
        <Form.Item
          label="Configuration Name"
          name="name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g., Standard Zimbabwe Work Week" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Work Start Time"
              name="work_start_time"
              rules={[{ required: true, message: 'Required' }]}
            >
              <TimePicker format="HH:mm:ss" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Work End Time"
              name="work_end_time"
              rules={[{ required: true, message: 'Required' }]}
            >
              <TimePicker format="HH:mm:ss" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Working Days">
          <Row gutter={8}>
            <Col span={8}>
              <Form.Item name="monday_working" valuePropName="checked" noStyle>
                <Checkbox>Monday</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tuesday_working" valuePropName="checked" noStyle>
                <Checkbox>Tuesday</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="wednesday_working" valuePropName="checked" noStyle>
                <Checkbox>Wednesday</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="thursday_working" valuePropName="checked" noStyle>
                <Checkbox>Thursday</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="friday_working" valuePropName="checked" noStyle>
                <Checkbox>Friday</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="saturday_working" valuePropName="checked" noStyle>
                <Checkbox>Saturday</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sunday_working" valuePropName="checked" noStyle>
                <Checkbox>Sunday</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Hours Per Day"
              name="total_work_hours_per_day"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={1} max={24} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Lunch Break (minutes)"
              name="lunch_break_duration"
            >
              <InputNumber min={0} max={120} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Is Default" name="is_default" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Is Active" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );

  const GroupModal = (
    <Modal
      title={editingItem ? 'Edit Approval Group' : 'Create Approval Group'}
      open={groupModalVisible}
      onCancel={() => {
        setGroupModalVisible(false);
        groupForm.resetFields();
      }}
      onOk={handleSaveGroup}
      width={600}
      okText="Save"
    >
      <Form form={groupForm} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Group Code"
              name="code"
              rules={[{ required: true, message: 'Group code is required' }]}
              tooltip="Unique identifier (e.g., GRP-EXEC, GRP-MGMT)"
            >
              <Input placeholder="e.g., GRP-EXEC" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Group Name"
              name="name"
              rules={[{ required: true, message: 'Group name is required' }]}
            >
              <Input placeholder="e.g., Executive Team" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Description" name="description">
          <TextArea rows={3} placeholder="Describe the purpose of this approval group (e.g., 'Senior management approval group')" />
        </Form.Item>

        <Form.Item label="Active" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );

  const MemberModal = (
    <Modal
      title={`Add Member to ${selectedGroup?.name || 'Group'}`}
      open={memberModalVisible}
      onCancel={() => {
        setMemberModalVisible(false);
        memberForm.resetFields();
      }}
      onOk={handleSaveMember}
      width={500}
      okText="Add Member"
    >
      <Form form={memberForm} layout="vertical">
        <Form.Item
          label="Employee"
          name="employee_id"
          rules={[{ required: true, message: 'Please select an employee' }]}
        >
          <Select
            placeholder="Search and select employee"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option: any) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {employees.map((emp: any) => (
              <Option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} ({emp.employee_number})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Role in Group"
          name="role"
          rules={[{ required: true, message: 'Please select a role' }]}
          tooltip="Admin: Can manage group, Lead: Group leader, Member: Standard member"
        >
          <Select placeholder="Select role">
            <Option value="member">Member</Option>
            <Option value="lead">Lead</Option>
            <Option value="admin">Admin</Option>
          </Select>
        </Form.Item>

        <Alert
          message="Group Membership"
          description="Employees can be members of multiple groups. The role determines their permissions within this specific group."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Form>
    </Modal>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      <PageHeader
        title="Leave System Settings"
        subtitle="Comprehensive leave management configuration - policies, workflows, holidays, and system settings"
        breadcrumbs={[
          { title: 'Human Resources' },
          { title: 'Leave Management', path: '/hr/leaves' },
          { title: 'Settings' },
        ]}
      />

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane
            tab={
              <span>
                <FileProtectOutlined />
                Leave Policies
              </span>
            }
            key="1"
          >
            {Tab1_LeavePolicies}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <TeamOutlined />
                Approval Workflows
              </span>
            }
            key="2"
          >
            {Tab2_ApprovalWorkflows}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <CalendarOutlined />
                Working Hours & Holidays
              </span>
            }
            key="3"
          >
            {Tab3_WorkingHoursAndHolidays}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <CheckCircleOutlined />
                Eligibility & Validation
              </span>
            }
            key="4"
          >
            {Tab4_EligibilityAndValidation}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <BellOutlined />
                Notifications & Calendar
              </span>
            }
            key="5"
          >
            {Tab5_NotificationsAndCalendar}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <DollarOutlined />
                Leave Year & Balances
              </span>
            }
            key="6"
          >
            {Tab6_LeaveYearAndBalances}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <UserOutlined />
                Approval Groups
              </span>
            }
            key="7"
          >
            {Tab7_ApprovalGroups}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Modals */}
      {PolicyModal}
      {WorkflowModal}
      {HolidayModal}
      {WorkingHoursModal}
      {GroupModal}
      {MemberModal}

      {/* Drag-and-Drop Member Manager */}
      <DragDropMemberManager
        visible={manageMembersVisible}
        group={selectedGroupForMembers}
        onClose={() => {
          setManageMembersVisible(false);
          setSelectedGroupForMembers(null);
        }}
        onSave={handleSaveMembers}
        allEmployees={allEmployeesWithGroups}
        currentMembers={selectedGroupForMembers?.memberships || []}
      />
    </div>
  );
};
