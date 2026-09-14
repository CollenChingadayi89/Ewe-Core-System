import { useState } from 'react';
import { Card, Row, Col, Button, Table, Calendar, Space, Typography, Statistic, Badge, Tag, message } from 'antd';
import {
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { PageHeader, StatCard } from '../../components/common';
import { useAuthStore } from '../../store/authStore';

const { Text, Title } = Typography;

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
}

export const MyAttendancePage = () => {
  const { user } = useAuthStore();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));

  // Mock attendance data
  const mockAttendanceRecords: AttendanceRecord[] = [
    { id: '1', date: '07/09/2026', checkIn: '08:15 AM', checkOut: '05:30 PM', hoursWorked: 9.25, status: 'present' },
    { id: '2', date: '06/09/2026', checkIn: '08:00 AM', checkOut: '05:15 PM', hoursWorked: 9.25, status: 'present' },
    { id: '3', date: '05/09/2026', checkIn: '08:45 AM', checkOut: '05:00 PM', hoursWorked: 8.25, status: 'late' },
    { id: '4', date: '04/09/2026', checkIn: '08:10 AM', checkOut: '05:20 PM', hoursWorked: 9.17, status: 'present' },
    { id: '5', date: '03/09/2026', checkIn: '08:05 AM', checkOut: '05:10 PM', hoursWorked: 9.08, status: 'present' },
    { id: '6', date: '02/09/2026', checkIn: '-', checkOut: '-', hoursWorked: 0, status: 'absent' },
  ];

  // Update time every second
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'));
    }, 1000);
    return () => clearInterval(interval);
  });

  // Calculate statistics
  const stats = {
    daysPresent: mockAttendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length,
    totalHours: mockAttendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0).toFixed(2),
    avgCheckIn: '08:15 AM',
    lateDays: mockAttendanceRecords.filter(r => r.status === 'late').length,
  };

  const handleClockIn = () => {
    const time = dayjs().format('hh:mm A');
    message.success(`Clocked in at ${time}`);
    setIsClockedIn(true);
  };

  const handleClockOut = () => {
    const time = dayjs().format('hh:mm A');
    message.success(`Clocked out at ${time}`);
    setIsClockedIn(false);
  };

  // Calendar cell renderer for attendance
  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('DD/MM/YYYY');
    const record = mockAttendanceRecords.find(r => r.date === dateStr);

    if (!record) return null;

    const statusColor = record.status === 'present' ? 'success' :
                       record.status === 'late' ? 'warning' :
                       record.status === 'absent' ? 'error' : 'default';

    return (
      <div>
        <Badge status={statusColor} text={record.status.toUpperCase()} />
      </div>
    );
  };

  // Table columns
  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text strong>{date}</Text>
        </Space>
      ),
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (time: string) => (
        <Space>
          <LoginOutlined style={{ color: '#00d084' }} />
          <Text>{time}</Text>
        </Space>
      ),
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (time: string) => (
        <Space>
          <LogoutOutlined style={{ color: '#ff6900' }} />
          <Text>{time}</Text>
        </Space>
      ),
    },
    {
      title: 'Hours Worked',
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      render: (hours: number) => (
        <Text strong style={{ color: '#00d084' }}>
          {hours} hrs
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: { [key: string]: string } = {
          present: 'green',
          late: 'orange',
          absent: 'red',
          'half-day': 'blue',
        };
        return (
          <Tag color={colors[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Attendance"
        subtitle="Track your attendance and working hours"
        breadcrumbs={[
          { title: 'Employee' },
          { title: 'My Attendance' },
        ]}
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Days Present (This Month)"
            value={stats.daysPresent}
            icon={<CheckCircleOutlined />}
            iconBg="#667eea"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Hours (This Month)"
            value={stats.totalHours}
            icon={<ClockCircleOutlined />}
            iconBg="#f093fb"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Avg Check-in Time"
            value={stats.avgCheckIn}
            icon={<LoginOutlined />}
            iconBg="#4facfe"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Late Days"
            value={stats.lateDays}
            icon={<CloseCircleOutlined />}
            iconBg="#ff6900"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Clock In/Out Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#00d084' }} />
                <Text strong>Clock In / Clock Out</Text>
              </Space>
            }
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              minHeight: '300px',
            }}
          >
            <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }} size="large">
              <div>
                <Text type="secondary">Current Time</Text>
                <div>
                  <Title level={1} style={{ margin: 0, color: '#00d084' }}>
                    {currentTime}
                  </Title>
                </div>
                <Text type="secondary">{dayjs().format('dddd, MMMM D, YYYY')}</Text>
              </div>

              <div style={{ marginTop: '24px' }}>
                {!isClockedIn ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<LoginOutlined />}
                    onClick={handleClockIn}
                    style={{
                      height: '60px',
                      fontSize: '18px',
                      background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      minWidth: '200px',
                    }}
                  >
                    Clock In
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    danger
                    size="large"
                    icon={<LogoutOutlined />}
                    onClick={handleClockOut}
                    style={{
                      height: '60px',
                      fontSize: '18px',
                      borderRadius: '12px',
                      minWidth: '200px',
                    }}
                  >
                    Clock Out
                  </Button>
                )}
              </div>

              {isClockedIn && (
                <div style={{ marginTop: '16px' }}>
                  <Tag color="green" style={{ fontSize: '14px', padding: '6px 16px' }}>
                    Currently Clocked In
                  </Tag>
                </div>
              )}

              <div style={{ marginTop: '24px', textAlign: 'left', width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Today's Check In:</Text>
                    <Text strong>08:15 AM</Text>
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Hours Today:</Text>
                    <Text strong style={{ color: '#00d084' }}>8.5 hrs</Text>
                  </Space>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Attendance Calendar */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: '#00d084' }} />
                <Text strong>Attendance Calendar</Text>
              </Space>
            }
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Calendar
              fullscreen={false}
              dateCellRender={dateCellRender}
            />
            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
              <Space size="large">
                <Space>
                  <Badge status="success" />
                  <Text>Present</Text>
                </Space>
                <Space>
                  <Badge status="warning" />
                  <Text>Late</Text>
                </Space>
                <Space>
                  <Badge status="error" />
                  <Text>Absent</Text>
                </Space>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Attendance Records Table */}
      <Card
        title="My Attendance Records"
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Table
          columns={columns}
          dataSource={mockAttendanceRecords}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
