/**
 * Leave Calendar Page
 *
 * Visual calendar showing all scheduled leaves for employees:
 * - Full calendar view with leave blocks
 * - Month/Week/Day views
 * - Filter by employee, department, leave type
 * - Color-coded by leave type
 * - Click to view leave details
 * - Export calendar data
 * - Team availability overview
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Calendar,
  Badge,
  Tag,
  Select,
  Space,
  Button,
  Row,
  Col,
  Drawer,
  List,
  Avatar,
  Tooltip,
  Statistic,
  Alert,
  Divider,
  Radio,
  Empty,
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  FilterOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { PageHeader, StatusTag } from '../../components/common';
import { useLeaveStore } from '../../store/leaveStore';
import { useAuthStore } from '../../store/authStore';
import type { LeaveRequest } from '../../types';
import { mockEmployees } from '../../mock/employees';
import { mockDepartments } from '../../mock/employees';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * Leave type colors (matching system-wide)
 */
const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: '#00d084',
  sick: '#ff6900',
  maternity: '#ec4899',
  paternity: '#3b82f6',
  special: '#8b5cf6',
  study: '#0693e3',
  unpaid: '#8c8c8c',
};

const LEAVE_TYPE_ICONS: Record<string, string> = {
  annual: '🏖️',
  sick: '🤒',
  maternity: '🤱',
  paternity: '👶',
  special: '⭐',
  study: '📚',
  unpaid: '💼',
};

interface CalendarLeaveEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

export const LeaveCalendarPage = () => {
  const { user } = useAuthStore();
  const { allRequests, loading, fetchAllRequests } = useLeaveStore();

  // State
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>(undefined);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('approved'); // Only show approved by default
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDayLeaves, setSelectedDayLeaves] = useState<CalendarLeaveEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);

  // Load data
  useEffect(() => {
    fetchAllRequests();
  }, []);

  // Convert leave requests to calendar events
  const calendarEvents: CalendarLeaveEvent[] = useMemo(() => {
    return allRequests
      .filter((req) => {
        // Filter by status
        if (statusFilter && req.status !== statusFilter) return false;

        // Filter by department
        if (departmentFilter) {
          const employee = mockEmployees.find((e) => e.id === req.requestorId);
          if (employee?.departmentId !== departmentFilter) return false;
        }

        // Filter by employee
        if (employeeFilter && req.requestorId !== employeeFilter) return false;

        // Filter by leave type
        if (leaveTypeFilter && req.data.leaveType !== leaveTypeFilter) return false;

        return true;
      })
      .map((req) => {
        const employee = mockEmployees.find((e) => e.id === req.requestorId);
        const department = mockDepartments.find((d) => d.id === employee?.departmentId);

        return {
          id: req.id,
          employeeId: req.requestorId,
          employeeName: req.requestorName,
          department: department?.name || 'Unknown',
          leaveType: req.data.leaveType,
          startDate: req.data.startDate,
          endDate: req.data.endDate,
          days: req.data.days,
          status: req.status,
        };
      });
  }, [allRequests, departmentFilter, employeeFilter, leaveTypeFilter, statusFilter]);

  // Get leaves for a specific date
  const getLeavesForDate = (date: Dayjs): CalendarLeaveEvent[] => {
    const dateStr = date.format('YYYY-MM-DD');
    return calendarEvents.filter((event) => {
      return dayjs(dateStr).isBetween(event.startDate, event.endDate, 'day', '[]');
    });
  };

  // Get leaves for current month
  const currentMonthLeaves = useMemo(() => {
    const monthStart = selectedDate.startOf('month').format('YYYY-MM-DD');
    const monthEnd = selectedDate.endOf('month').format('YYYY-MM-DD');

    return calendarEvents.filter((event) => {
      // Leave overlaps with current month
      return (
        dayjs(event.startDate).isSameOrBefore(monthEnd) &&
        dayjs(event.endDate).isSameOrAfter(monthStart)
      );
    });
  }, [calendarEvents, selectedDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEmployees = new Set(currentMonthLeaves.map((l) => l.employeeId)).size;
    const totalDays = currentMonthLeaves.reduce((sum, l) => sum + l.days, 0);
    const byType = currentMonthLeaves.reduce((acc, l) => {
      acc[l.leaveType] = (acc[l.leaveType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLeaves: currentMonthLeaves.length,
      totalEmployees,
      totalDays,
      byType,
    };
  }, [currentMonthLeaves]);

  // Render full cell with highlighted background
  const fullCellRender = (value: Dayjs) => {
    const leaves = getLeavesForDate(value);
    const isCurrentMonth = value.month() === selectedDate.month();
    const isToday = value.isSame(dayjs(), 'day');

    // Determine background color based on leaves
    let backgroundColor = 'transparent';
    let borderColor = '#f0f0f0';

    if (leaves.length > 0 && isCurrentMonth) {
      // If multiple leaves, use a gradient or dominant leave type color
      const dominantLeave = leaves[0];
      backgroundColor = `${LEAVE_TYPE_COLORS[dominantLeave.leaveType]}15`; // 15 for transparency
      borderColor = LEAVE_TYPE_COLORS[dominantLeave.leaveType];
    }

    if (isToday) {
      borderColor = '#00d084';
    }

    return (
      <div
        style={{
          height: '100%',
          minHeight: '80px',
          backgroundColor,
          border: `2px solid ${borderColor}`,
          borderRadius: '4px',
          padding: '4px',
          position: 'relative',
          opacity: isCurrentMonth ? 1 : 0.4,
          cursor: leaves.length > 0 ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }}
        onClick={() => leaves.length > 0 && handleDateClick(value)}
        onMouseEnter={(e) => {
          if (leaves.length > 0) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Date number */}
        <div
          style={{
            textAlign: 'right',
            fontSize: '14px',
            fontWeight: isToday ? 'bold' : 'normal',
            color: isToday ? '#00d084' : isCurrentMonth ? '#000' : '#999',
            marginBottom: '4px',
          }}
        >
          {value.date()}
        </div>

        {/* Leave indicators */}
        {leaves.length > 0 && (
          <div style={{ fontSize: '11px' }}>
            {leaves.slice(0, 2).map((leave) => (
              <div
                key={leave.id}
                style={{
                  background: LEAVE_TYPE_COLORS[leave.leaveType],
                  color: 'white',
                  padding: '2px 4px',
                  marginBottom: '2px',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '10px',
                  fontWeight: 500,
                }}
              >
                {LEAVE_TYPE_ICONS[leave.leaveType]} {leave.employeeName.split(' ')[0]}
              </div>
            ))}
            {leaves.length > 2 && (
              <div
                style={{
                  color: '#595959',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 4px',
                }}
              >
                +{leaves.length - 2} more
              </div>
            )}
          </div>
        )}

        {/* Badge for multiple leaves */}
        {leaves.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              backgroundColor: '#ff6900',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            {leaves.length}
          </div>
        )}
      </div>
    );
  };

  // Render cell content for calendar (fallback for list view)
  const dateCellRender = (value: Dayjs) => {
    const leaves = getLeavesForDate(value);
    if (leaves.length === 0) return null;

    // Show up to 3 leaves, then "+X more"
    const displayLeaves = leaves.slice(0, 3);
    const remaining = leaves.length - 3;

    return (
      <div style={{ fontSize: '11px' }}>
        {displayLeaves.map((leave) => (
          <div
            key={leave.id}
            style={{
              background: LEAVE_TYPE_COLORS[leave.leaveType],
              color: 'white',
              padding: '1px 4px',
              marginBottom: '2px',
              borderRadius: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleDateClick(value);
            }}
          >
            {LEAVE_TYPE_ICONS[leave.leaveType]} {leave.employeeName.split(' ')[0]}
          </div>
        ))}
        {remaining > 0 && (
          <div
            style={{
              color: '#8c8c8c',
              fontSize: '10px',
              padding: '1px 4px',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleDateClick(value);
            }}
          >
            +{remaining} more
          </div>
        )}
      </div>
    );
  };

  // Handle date click
  const handleDateClick = (date: Dayjs) => {
    const leaves = getLeavesForDate(date);
    setSelectedDay(date);
    setSelectedDayLeaves(leaves);
    setDrawerVisible(true);
  };

  // Handle month/year change
  const handlePanelChange = (value: Dayjs) => {
    setSelectedDate(value);
  };

  // Navigate months
  const goToPrevMonth = () => {
    setSelectedDate(selectedDate.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setSelectedDate(selectedDate.add(1, 'month'));
  };

  const goToToday = () => {
    setSelectedDate(dayjs());
  };

  // Export calendar data
  const handleExport = () => {
    const csv = [
      ['Employee', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status'].join(','),
      ...currentMonthLeaves.map((leave) =>
        [
          leave.employeeName,
          leave.department,
          leave.leaveType,
          dayjs(leave.startDate).format('DD/MM/YYYY'),
          dayjs(leave.endDate).format('DD/MM/YYYY'),
          leave.days,
          leave.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-calendar-${selectedDate.format('YYYY-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear filters
  const handleClearFilters = () => {
    setDepartmentFilter(undefined);
    setEmployeeFilter(undefined);
    setLeaveTypeFilter(undefined);
    setStatusFilter('approved');
  };

  return (
    <div>
      <PageHeader
        title="Leave Calendar"
        subtitle={`${selectedDate.format('MMMM YYYY')} - ${stats.totalLeaves} leave${
          stats.totalLeaves !== 1 ? 's' : ''
        } scheduled`}
        breadcrumbs={[
          { title: 'Human Resources' },
          { title: 'Leave Management', path: '/hr/leaves' },
          { title: 'Calendar' },
        ]}
        actions={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button type="primary" icon={<CalendarOutlined />} onClick={goToToday}>
              Today
            </Button>
          </Space>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Leaves"
              value={stats.totalLeaves}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Employees on Leave"
              value={stats.totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#00d084' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Days"
              value={stats.totalDays}
              suffix="days"
              valueStyle={{ color: '#ff6900' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '8px' }}>
              By Type
            </div>
            <Space wrap>
              {Object.entries(stats.byType).map(([type, count]) => (
                <Tag key={type} color={LEAVE_TYPE_COLORS[type]}>
                  {LEAVE_TYPE_ICONS[type]} {count}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '20px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Department</span>
              <Select
                placeholder="All Departments"
                style={{ width: '100%' }}
                value={departmentFilter}
                onChange={setDepartmentFilter}
                allowClear
              >
                {mockDepartments.map((dept) => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Employee</span>
              <Select
                placeholder="All Employees"
                style={{ width: '100%' }}
                value={employeeFilter}
                onChange={setEmployeeFilter}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.children as string).toLowerCase().includes(input.toLowerCase())
                }
              >
                {mockEmployees.map((emp) => (
                  <Select.Option key={emp.id} value={emp.id}>
                    {emp.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Leave Type</span>
              <Select
                placeholder="All Types"
                style={{ width: '100%' }}
                value={leaveTypeFilter}
                onChange={setLeaveTypeFilter}
                allowClear
              >
                <Select.Option value="annual">Annual</Select.Option>
                <Select.Option value="sick">Sick</Select.Option>
                <Select.Option value="maternity">Maternity</Select.Option>
                <Select.Option value="paternity">Paternity</Select.Option>
                <Select.Option value="special">Special</Select.Option>
                <Select.Option value="study">Study</Select.Option>
                <Select.Option value="unpaid">Unpaid</Select.Option>
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Status</span>
              <Select
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Select.Option value="approved">Approved Only</Select.Option>
                <Select.Option value="pending">Pending Only</Select.Option>
                <Select.Option value="">All Statuses</Select.Option>
              </Select>
            </Space>
          </Col>

          <Col xs={24}>
            <Button
              icon={<FilterOutlined />}
              onClick={handleClearFilters}
              size="small"
              type="link"
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Calendar Navigation */}
      <Card style={{ marginBottom: '20px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<LeftOutlined />} onClick={goToPrevMonth} />
              <Button onClick={goToToday}>Today</Button>
              <Button icon={<RightOutlined />} onClick={goToNextMonth} />
            </Space>
          </Col>
          <Col>
            <h2 style={{ margin: 0 }}>{selectedDate.format('MMMM YYYY')}</h2>
          </Col>
          <Col>
            <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
              <Radio.Button value="month">Month</Radio.Button>
              <Radio.Button value="year">Year</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* Calendar */}
      <Card loading={loading}>
        {currentMonthLeaves.length === 0 ? (
          <Empty
            description="No scheduled leaves for this period"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Calendar
            value={selectedDate}
            mode={viewMode}
            fullCellRender={viewMode === 'month' ? fullCellRender : undefined}
            onPanelChange={handlePanelChange}
            onSelect={handleDateClick}
            style={{
              border: 'none',
            }}
          />
        )}
      </Card>

      {/* Legend */}
      <Card title="Legend" style={{ marginTop: '20px' }}>
        <Space wrap>
          {Object.entries(LEAVE_TYPE_COLORS).map(([type, color]) => (
            <Tag key={type} color={color} style={{ padding: '4px 12px' }}>
              {LEAVE_TYPE_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)} Leave
            </Tag>
          ))}
        </Space>
      </Card>

      {/* Day Details Drawer */}
      <Drawer
        title={
          selectedDay ? (
            <Space>
              <CalendarOutlined />
              <span>{selectedDay.format('dddd, DD MMMM YYYY')}</span>
            </Space>
          ) : (
            'Leave Details'
          )
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedDayLeaves.length === 0 ? (
          <Empty description="No leaves scheduled for this day" />
        ) : (
          <>
            <Alert
              message={`${selectedDayLeaves.length} employee${
                selectedDayLeaves.length !== 1 ? 's' : ''
              } on leave`}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <List
              dataSource={selectedDayLeaves}
              renderItem={(leave) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: LEAVE_TYPE_COLORS[leave.leaveType],
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>
                          {LEAVE_TYPE_ICONS[leave.leaveType]}
                        </span>
                      </Avatar>
                    }
                    title={
                      <Space>
                        <span style={{ fontWeight: 600 }}>{leave.employeeName}</span>
                        <StatusTag status={leave.status} />
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '4px' }}>
                          <Tag color={LEAVE_TYPE_COLORS[leave.leaveType]}>
                            {leave.leaveType.toUpperCase()}
                          </Tag>
                          <Tag>{leave.department}</Tag>
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {dayjs(leave.startDate).format('DD/MM/YYYY')} →{' '}
                          {dayjs(leave.endDate).format('DD/MM/YYYY')}
                          <span style={{ marginLeft: '8px' }}>({leave.days} days)</span>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};
