/**
 * Leave System Settings Page
 *
 * Centralized configuration for all leave management settings:
 * - Leave types and entitlements
 * - Accrual rates and carryforward rules
 * - Approval workflows and escalation
 * - Working days and public holidays
 * - Notice periods and documentation requirements
 * - Calendar and notification settings
 */

import { useState } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Table,
  Space,
  Modal,
  Divider,
  Alert,
  Tag,
  Tooltip,
  Row,
  Col,
  Checkbox,
  DatePicker,
  TimePicker,
  List,
  message,
  Typography,
  Collapse,
  Segmented,
  ColorPicker,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SettingOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BellOutlined,
  FileTextOutlined,
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  GlobalOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LeaveTypeConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  isStatutory: boolean;
  statutoryReference?: string;
  isActive: boolean;
  isPaid: boolean;

  // Entitlement
  annualEntitlementDays: number;
  accrualMethod: 'monthly' | 'annual' | 'fixed' | 'none';
  monthlyAccrualRate?: number; // For monthly accrual
  maxAccumulationDays?: number;

  // Eligibility
  requiresMinimumService: boolean;
  minimumServiceDays?: number;
  restrictedToGender?: 'male' | 'female' | 'none';
  availableDuringProbation: boolean;

  // Carryforward
  allowCarryForward: boolean;
  carryForwardMaxDays?: number;
  carryForwardExpiryMonths?: number;
  payoutOnTermination: boolean;

  // Documentation
  requiresDocumentation: boolean;
  documentationType?: string[];
  documentationMandatory: boolean;

  // Notice
  minimumNoticeDays: number;
  minimumNoticeForShortLeave?: number;

  // Other
  countsWeekendsInLeave: boolean;
  countsPublicHolidaysInLeave: boolean;
  supportsHalfDays: boolean;
}

interface WorkingHoursConfig {
  workdayStart: string; // "09:00"
  workdayEnd: string; // "17:00"
  lunchBreakStart: string; // "13:00"
  lunchBreakEnd: string; // "14:00"
  workingDays: number[]; // [1,2,3,4,5] = Mon-Fri
  hoursPerDay: number;
  hoursPerWeek: number;
}

interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD or MM-DD for recurring
  isRecurring: boolean;
  year?: number;
  affectsLeaveCalculation: boolean;
}

interface NotificationSettings {
  notifyOnSubmission: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  notifyOnCancellation: boolean;
  notifyBeforeLeaveStarts: boolean;
  reminderDaysBeforeLeave: number;
  escalationReminderDays: number;
  notifyHROnAllRequests: boolean;
  notifyManagerOnTeamLeave: boolean;
}

interface CalendarSettings {
  defaultView: 'month' | 'week' | 'day';
  weekStartsOn: number; // 0=Sunday, 1=Monday
  showWeekendsOnCalendar: boolean;
  highlightPublicHolidays: boolean;
  showOnlyApprovedLeaves: boolean;
  colorScheme: 'default' | 'colorblind' | 'high-contrast';
}

interface LeaveYearSettings {
  leaveYearType: 'calendar' | 'financial' | 'anniversary';
  calendarYearStart: string; // "01-01"
  financialYearStart?: string; // "04-01" for Zimbabwe
  autoCarryForward: boolean;
  carryForwardProcessingMonth: string; // "01" = January
  allowNegativeBalance: boolean;
  maxNegativeBalanceDays: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LeaveSystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('leave-types');
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ============================================================================
  // MOCK DATA (would come from store/API)
  // ============================================================================

  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([
    {
      id: 'annual',
      name: 'annual',
      displayName: 'Annual / Vacation Leave',
      description: 'Paid leave for rest and recovery',
      color: '#00d084',
      icon: '🏖️',
      isStatutory: true,
      statutoryReference: 's14A - Labour Act [Chapter 28:01]',
      isActive: true,
      isPaid: true,
      annualEntitlementDays: 30,
      accrualMethod: 'monthly',
      monthlyAccrualRate: 2.5,
      maxAccumulationDays: 90,
      requiresMinimumService: true,
      minimumServiceDays: 365,
      restrictedToGender: 'none',
      availableDuringProbation: false,
      allowCarryForward: true,
      carryForwardMaxDays: 90,
      payoutOnTermination: true,
      requiresDocumentation: false,
      documentationMandatory: false,
      minimumNoticeDays: 14,
      minimumNoticeForShortLeave: 3,
      countsWeekendsInLeave: true,
      countsPublicHolidaysInLeave: true,
      supportsHalfDays: true,
    },
    // Add more leave types...
  ]);

  const [workingHours, setWorkingHours] = useState<WorkingHoursConfig>({
    workdayStart: '08:00',
    workdayEnd: '17:00',
    lunchBreakStart: '13:00',
    lunchBreakEnd: '14:00',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    hoursPerDay: 8,
    hoursPerWeek: 40,
  });

  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([
    { id: '1', name: 'New Year\'s Day', date: '01-01', isRecurring: true, affectsLeaveCalculation: true },
    { id: '2', name: 'Independence Day', date: '04-18', isRecurring: true, affectsLeaveCalculation: true },
    { id: '3', name: 'Workers\' Day', date: '05-01', isRecurring: true, affectsLeaveCalculation: true },
    { id: '4', name: 'Africa Day', date: '05-25', isRecurring: true, affectsLeaveCalculation: true },
    { id: '5', name: 'Heroes\' Day', date: '08-11', isRecurring: true, affectsLeaveCalculation: true },
    { id: '6', name: 'Defence Forces Day', date: '08-12', isRecurring: true, affectsLeaveCalculation: true },
    { id: '7', name: 'Unity Day', date: '12-22', isRecurring: true, affectsLeaveCalculation: true },
    { id: '8', name: 'Christmas Day', date: '12-25', isRecurring: true, affectsLeaveCalculation: true },
    { id: '9', name: 'Boxing Day', date: '12-26', isRecurring: true, affectsLeaveCalculation: true },
  ]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    notifyOnSubmission: true,
    notifyOnApproval: true,
    notifyOnRejection: true,
    notifyOnCancellation: true,
    notifyBeforeLeaveStarts: true,
    reminderDaysBeforeLeave: 3,
    escalationReminderDays: 2,
    notifyHROnAllRequests: true,
    notifyManagerOnTeamLeave: true,
  });

  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    defaultView: 'month',
    weekStartsOn: 1, // Monday
    showWeekendsOnCalendar: true,
    highlightPublicHolidays: true,
    showOnlyApprovedLeaves: false,
    colorScheme: 'default',
  });

  const [leaveYearSettings, setLeaveYearSettings] = useState<LeaveYearSettings>({
    leaveYearType: 'financial',
    calendarYearStart: '01-01',
    financialYearStart: '04-01', // Zimbabwe financial year
    autoCarryForward: true,
    carryForwardProcessingMonth: '04',
    allowNegativeBalance: false,
    maxNegativeBalanceDays: 0,
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSaveLeaveType = (values: any) => {
    console.log('Saving leave type:', values);
    message.success('Leave type configuration saved');
    setIsModalOpen(false);
  };

  const handleSaveWorkingHours = (values: WorkingHoursConfig) => {
    setWorkingHours(values);
    message.success('Working hours updated successfully');
  };

  const handleSaveNotifications = (values: NotificationSettings) => {
    setNotificationSettings(values);
    message.success('Notification settings updated successfully');
  };

  const handleSaveCalendar = (values: CalendarSettings) => {
    setCalendarSettings(values);
    message.success('Calendar settings updated successfully');
  };

  const handleSaveLeaveYear = (values: LeaveYearSettings) => {
    setLeaveYearSettings(values);
    message.success('Leave year settings updated successfully');
  };

  const handleAddPublicHoliday = (values: any) => {
    const newHoliday: PublicHoliday = {
      id: Date.now().toString(),
      ...values,
    };
    setPublicHolidays([...publicHolidays, newHoliday]);
    message.success('Public holiday added');
  };

  const handleDeletePublicHoliday = (id: string) => {
    setPublicHolidays(publicHolidays.filter(h => h.id !== id));
    message.success('Public holiday deleted');
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const leaveTypeColumns: ColumnsType<LeaveTypeConfig> = [
    {
      title: 'Leave Type',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <Space>
          <span style={{ fontSize: '20px' }}>{record.icon}</span>
          <div>
            <div><Text strong>{text}</Text></div>
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'isStatutory',
      key: 'isStatutory',
      width: 100,
      render: (isStatutory) => (
        <Tag color={isStatutory ? 'blue' : 'default'}>
          {isStatutory ? 'Statutory' : 'Proposed'}
        </Tag>
      ),
    },
    {
      title: 'Entitlement',
      key: 'entitlement',
      width: 150,
      render: (_, record) => (
        <div>
          <div><Text strong>{record.annualEntitlementDays} days/year</Text></div>
          {record.accrualMethod === 'monthly' && (
            <div><Text type="secondary" style={{ fontSize: '12px' }}>
              {record.monthlyAccrualRate} days/month
            </Text></div>
          )}
        </div>
      ),
    },
    {
      title: 'Paid',
      dataIndex: 'isPaid',
      key: 'isPaid',
      width: 80,
      render: (isPaid) => (
        isPaid ? <Tag color="success">Paid</Tag> : <Tag>Unpaid</Tag>
      ),
    },
    {
      title: 'Notice',
      dataIndex: 'minimumNoticeDays',
      key: 'minimumNoticeDays',
      width: 100,
      render: (days) => `${days} days`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        isActive ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
        ) : (
          <Tag>Inactive</Tag>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const holidayColumns: ColumnsType<PublicHoliday> = [
    {
      title: 'Holiday Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date, record) => (
        <Space>
          <Text>{date}</Text>
          {record.isRecurring && <Tag color="blue">Recurring</Tag>}
        </Space>
      ),
    },
    {
      title: 'Affects Leave',
      dataIndex: 'affectsLeaveCalculation',
      key: 'affectsLeaveCalculation',
      render: (affects) => (
        affects ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : '-'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeletePublicHoliday(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ============================================================================
  // TAB CONTENT COMPONENTS
  // ============================================================================

  const LeaveTypesTab = () => (
    <div>
      <Alert
        title="Leave Type Configuration"
        description="Configure leave types, entitlements, accrual rates, and eligibility rules. Statutory leave types are mandated by Zimbabwe Labour Act."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <Title level={5}>Configured Leave Types</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Add Leave Type
          </Button>
        </div>
        <Table
          columns={leaveTypeColumns}
          dataSource={leaveTypes}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  const WorkingHoursTab = () => (
    <div>
      <Alert
        title="Working Hours & Days"
        description="Configure standard working hours, working days, and break times. These settings affect leave day calculations and working day counts."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="Working Hours Configuration">
        <Form
          layout="vertical"
          initialValues={workingHours}
          onFinish={handleSaveWorkingHours}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Workday Start Time"
                name="workdayStart"
                rules={[{ required: true }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Workday End Time"
                name="workdayEnd"
                rules={[{ required: true }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Lunch Break Start" name="lunchBreakStart">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Lunch Break End" name="lunchBreakEnd">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Working Days" name="workingDays">
                <Checkbox.Group>
                  <Checkbox value={1}>Monday</Checkbox>
                  <Checkbox value={2}>Tuesday</Checkbox>
                  <Checkbox value={3}>Wednesday</Checkbox>
                  <Checkbox value={4}>Thursday</Checkbox>
                  <Checkbox value={5}>Friday</Checkbox>
                  <Checkbox value={6}>Saturday</Checkbox>
                  <Checkbox value={0}>Sunday</Checkbox>
                </Checkbox.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Hours Per Day"
                name="hoursPerDay"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={24} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Hours Per Week"
                name="hoursPerWeek"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={168} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Working Hours
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const PublicHolidaysTab = () => (
    <div>
      <Alert
        title="Public Holidays Calendar"
        description="Zimbabwe public holidays that affect leave calculations. These dates are excluded from working day counts when calculating leave duration."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <Title level={5}>Zimbabwe Public Holidays</Title>
          <Button type="primary" icon={<PlusOutlined />}>
            Add Holiday
          </Button>
        </div>
        <Table
          columns={holidayColumns}
          dataSource={publicHolidays}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  const NotificationsTab = () => (
    <div>
      <Alert
        title="Notification Settings"
        description="Configure email and in-app notifications for leave requests, approvals, and reminders."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="Notification Preferences">
        <Form
          layout="vertical"
          initialValues={notificationSettings}
          onFinish={handleSaveNotifications}
        >
          <Divider>Request Notifications</Divider>
          <Form.Item name="notifyOnSubmission" valuePropName="checked">
            <Checkbox>Notify employee when leave request is submitted</Checkbox>
          </Form.Item>
          <Form.Item name="notifyOnApproval" valuePropName="checked">
            <Checkbox>Notify employee when leave request is approved</Checkbox>
          </Form.Item>
          <Form.Item name="notifyOnRejection" valuePropName="checked">
            <Checkbox>Notify employee when leave request is rejected</Checkbox>
          </Form.Item>
          <Form.Item name="notifyOnCancellation" valuePropName="checked">
            <Checkbox>Notify relevant parties when leave is cancelled</Checkbox>
          </Form.Item>

          <Divider>Reminder Notifications</Divider>
          <Form.Item name="notifyBeforeLeaveStarts" valuePropName="checked">
            <Checkbox>Send reminder before leave starts</Checkbox>
          </Form.Item>
          <Form.Item
            label="Days Before Leave to Send Reminder"
            name="reminderDaysBeforeLeave"
          >
            <InputNumber min={0} max={30} style={{ width: '200px' }} />
          </Form.Item>
          <Form.Item
            label="Days Before Escalation Reminder"
            name="escalationReminderDays"
          >
            <InputNumber min={0} max={10} style={{ width: '200px' }} />
          </Form.Item>

          <Divider>Manager & HR Notifications</Divider>
          <Form.Item name="notifyHROnAllRequests" valuePropName="checked">
            <Checkbox>Notify HR on all leave requests (for tracking)</Checkbox>
          </Form.Item>
          <Form.Item name="notifyManagerOnTeamLeave" valuePropName="checked">
            <Checkbox>Notify manager when team member submits leave</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Notification Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const CalendarTab = () => (
    <div>
      <Alert
        title="Calendar Display Settings"
        description="Configure how the leave calendar is displayed to users."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="Calendar Preferences">
        <Form
          layout="vertical"
          initialValues={calendarSettings}
          onFinish={handleSaveCalendar}
        >
          <Form.Item label="Default Calendar View" name="defaultView">
            <Select style={{ width: '200px' }}>
              <Option value="month">Month View</Option>
              <Option value="week">Week View</Option>
              <Option value="day">Day View</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Week Starts On" name="weekStartsOn">
            <Select style={{ width: '200px' }}>
              <Option value={0}>Sunday</Option>
              <Option value={1}>Monday</Option>
              <Option value={6}>Saturday</Option>
            </Select>
          </Form.Item>

          <Form.Item name="showWeekendsOnCalendar" valuePropName="checked">
            <Checkbox>Show weekends on calendar</Checkbox>
          </Form.Item>

          <Form.Item name="highlightPublicHolidays" valuePropName="checked">
            <Checkbox>Highlight public holidays on calendar</Checkbox>
          </Form.Item>

          <Form.Item name="showOnlyApprovedLeaves" valuePropName="checked">
            <Checkbox>Show only approved leaves (hide pending/rejected)</Checkbox>
          </Form.Item>

          <Form.Item label="Color Scheme" name="colorScheme">
            <Select style={{ width: '200px' }}>
              <Option value="default">Default</Option>
              <Option value="colorblind">Colorblind Friendly</Option>
              <Option value="high-contrast">High Contrast</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Calendar Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const LeaveYearTab = () => (
    <div>
      <Alert
        title="Leave Year Configuration"
        description="Configure when your leave year starts, carryforward processing, and balance rules."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="Leave Year Settings">
        <Form
          layout="vertical"
          initialValues={leaveYearSettings}
          onFinish={handleSaveLeaveYear}
        >
          <Form.Item label="Leave Year Type" name="leaveYearType">
            <Select style={{ width: '300px' }}>
              <Option value="calendar">Calendar Year (Jan 1 - Dec 31)</Option>
              <Option value="financial">Financial Year (Apr 1 - Mar 31)</Option>
              <Option value="anniversary">Anniversary-based (per employee)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Financial Year Start Date"
            name="financialYearStart"
            tooltip="Zimbabwe financial year typically starts April 1"
          >
            <Input placeholder="MM-DD (e.g., 04-01)" style={{ width: '200px' }} />
          </Form.Item>

          <Divider>Carryforward Rules</Divider>

          <Form.Item name="autoCarryForward" valuePropName="checked">
            <Checkbox>Automatically carry forward unused leave at year end</Checkbox>
          </Form.Item>

          <Form.Item
            label="Process Carryforward In Month"
            name="carryForwardProcessingMonth"
            tooltip="Month when carryforward is processed (usually start of new leave year)"
          >
            <Select style={{ width: '200px' }}>
              {Array.from({ length: 12 }, (_, i) => (
                <Option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                  {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                </Option>
              ))}
            </Select>
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
            <InputNumber min={0} max={30} style={{ width: '200px' }} />
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

  // ============================================================================
  // RENDER
  // ============================================================================

  const tabItems = [
    {
      key: 'leave-types',
      label: (
        <span>
          <CalendarOutlined /> Leave Types
        </span>
      ),
      children: <LeaveTypesTab />,
    },
    {
      key: 'working-hours',
      label: (
        <span>
          <ClockCircleOutlined /> Working Hours
        </span>
      ),
      children: <WorkingHoursTab />,
    },
    {
      key: 'public-holidays',
      label: (
        <span>
          <GlobalOutlined /> Public Holidays
        </span>
      ),
      children: <PublicHolidaysTab />,
    },
    {
      key: 'leave-year',
      label: (
        <span>
          <DollarOutlined /> Leave Year
        </span>
      ),
      children: <LeaveYearTab />,
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined /> Notifications
        </span>
      ),
      children: <NotificationsTab />,
    },
    {
      key: 'calendar',
      label: (
        <span>
          <SettingOutlined /> Calendar Display
        </span>
      ),
      children: <CalendarTab />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Leave System Settings
        </Title>
        <Paragraph type="secondary">
          Configure all aspects of the leave management system: leave types, entitlements, working hours,
          public holidays, notifications, and calendar display preferences.
        </Paragraph>
      </div>

      {/* Main Settings Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
      />
    </div>
  );
};
