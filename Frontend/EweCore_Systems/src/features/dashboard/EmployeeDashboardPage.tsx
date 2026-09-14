import {
  Card,
  Col,
  Row,
  Avatar,
  Button,
  Typography,
  Progress,
  List,
  Tag,
  Space,
  Badge,
  Checkbox,
} from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  StarOutlined,
  TeamOutlined,
  BellOutlined,
  FileTextOutlined,
  CloseOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  mockEmployeeProfile,
  mockLeaveBalance,
  mockAttendanceToday,
  mockProjects,
  mockTasks,
  mockPerformance,
  mockSkills,
  mockTeamMembers,
  mockNotifications,
  mockMeetings,
  mockLeavePolicy,
  mockNextHoliday,
  mockTeamBirthday,
} from '../../mock/employeeDashboard';

const { Title, Text } = Typography;

export const EmployeeDashboardPage = () => {
  // Prepare leave pie chart data
  const leavePieData = [
    { name: 'On time', value: mockLeaveBalance.leaveTypes[0].count, color: '#1e40af' },
    { name: 'Late', value: mockLeaveBalance.leaveTypes[1].count, color: '#00d084' },
    { name: 'WFH', value: mockLeaveBalance.leaveTypes[2].count, color: '#ff6900' },
    { name: 'Absent', value: mockLeaveBalance.leaveTypes[3].count, color: '#fbbf24' },
    { name: 'Sick', value: mockLeaveBalance.leaveTypes[4].count, color: '#cf2e2e' },
  ];

  // Calculate total hours as percentage for circular progress
  const totalMinutes = 9 * 60; // 9 hours = 540 minutes
  const workedMinutes = 6 * 60 + 45; // 6:45
  const workedPercentage = Math.round((workedMinutes / totalMinutes) * 100);

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ color: '#262626', marginBottom: '4px', fontSize: '24px' }}>
            Employee Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>Dashboard / Employee Dashboard</Text>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button style={{ borderRadius: '6px' }}>Export</Button>
          <Text type="secondary" style={{ fontSize: '13px' }}>18/05/2025</Text>
        </div>
      </div>

      {/* Success Alert */}
      <Card
        style={{
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          border: '1px solid #00d084',
          borderRadius: '8px',
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#14532d', fontSize: '14px' }}>
            Your Leave Request on "20th April 2024" has been Approved!!!
          </Text>
          <CloseOutlined style={{ color: '#14532d', cursor: 'pointer' }} />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Left Column - Profile & Leave Details */}
        <Col xs={24} lg={6}>
          {/* Profile Card */}
          <Card
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Profile Header with Gradient */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                padding: '24px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <Avatar
                  size={80}
                  style={{
                    background: 'linear-gradient(135deg, #00d084 0%, #00bfa5 100%)',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    border: '3px solid white',
                  }}
                >
                  {mockEmployeeProfile.avatar}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Title level={5} style={{ color: 'white', margin: 0, fontSize: '16px' }}>
                        {mockEmployeeProfile.name}
                      </Title>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                        {mockEmployeeProfile.role}
                      </Text>
                    </div>
                    <Badge
                      status="success"
                      text={<Text style={{ color: 'white', fontSize: '11px' }}>Online</Text>}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div style={{ padding: '20px' }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Phone Number
                  </Text>
                  <Text strong style={{ fontSize: '13px' }}>
                    {mockEmployeeProfile.phoneNumber}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Email Address
                  </Text>
                  <Text strong style={{ fontSize: '13px' }}>
                    {mockEmployeeProfile.emailAddress}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Report Office
                  </Text>
                  <Text strong style={{ fontSize: '13px' }}>
                    {mockEmployeeProfile.reportOffice}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Joined on
                  </Text>
                  <Text strong style={{ fontSize: '13px' }}>
                    {mockEmployeeProfile.joinedOn}
                  </Text>
                </div>
              </Space>
            </div>
          </Card>

          {/* Leave Details Cards */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: '14px' }}>Leave Details</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>2025</Text>
              </div>
            }
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '16px' }}
          >
            {/* Leave Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#262626', display: 'block' }}>
                  {mockLeaveBalance.totalLeaves}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>Total Leaves</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#262626', display: 'block' }}>
                  {mockLeaveBalance.taken}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>Taken</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#262626', display: 'block' }}>
                  {mockLeaveBalance.absent}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>Absent</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#262626', display: 'block' }}>
                  {mockLeaveBalance.request}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>Request</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#262626', display: 'block' }}>
                  {mockLeaveBalance.workedDays}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>Worked Days</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#262626', display: 'block' }}>
                  {mockLeaveBalance.lossOfPay}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>Loss of Pay</Text>
              </div>
            </div>

            {/* Pie Chart */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={leavePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {leavePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ marginBottom: '12px' }}>
              {mockLeaveBalance.leaveTypes.map((item) => (
                <div
                  key={item.type}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '12px',
                  }}
                >
                  <Space size={4}>
                    <Badge color={item.color} />
                    <Text style={{ fontSize: '12px' }}>{item.count}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.type}</Text>
                  </Space>
                </div>
              ))}
            </div>

            {/* Better than badge */}
            <div
              style={{
                padding: '8px 12px',
                background: '#fff4e6',
                borderRadius: '6px',
                textAlign: 'center',
                border: '1px solid #ff6900',
              }}
            >
              <Text style={{ fontSize: '12px', color: '#ff6900' }}>
                Better than <strong>{mockLeaveBalance.betterThan}%</strong> of Employees
              </Text>
            </div>

            <Button
              type="primary"
              block
              style={{
                marginTop: '12px',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: 'none',
                borderRadius: '6px',
                height: '36px',
                fontWeight: '500',
              }}
            >
              Apply New Leave
            </Button>
          </Card>
        </Col>

        {/* Middle Column */}
        <Col xs={24} lg={12}>
          {/* Attendance Card */}
          <Card
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #ffe7ba',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                    Attendance
                  </Text>
                  <Title level={4} style={{ margin: 0, fontSize: '20px', marginBottom: '4px' }}>
                    {mockAttendanceToday.clockIn}, {mockAttendanceToday.date}
                  </Title>
                  <div style={{ position: 'relative', width: '140px', height: '140px', margin: '16px auto' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: workedPercentage },
                            { value: 100 - workedPercentage },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={65}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                        >
                          <Cell fill="#00d084" />
                          <Cell fill="#f0f0f0" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}
                    >
                      <Text strong style={{ fontSize: '18px', display: 'block', color: '#00d084' }}>
                        Total Hours
                      </Text>
                      <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                        {mockAttendanceToday.totalHoursToday}
                      </Text>
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#1e293b',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: '12px' }}>
                      Production: <strong>{mockAttendanceToday.production}</strong>
                    </Text>
                  </div>
                  <Button
                    danger
                    block
                    style={{
                      background: 'linear-gradient(135deg, #ff6900 0%, #ff8534 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      height: '36px',
                      fontWeight: '500',
                      color: 'white',
                    }}
                  >
                    Punch Out
                  </Button>
                  <Text
                    type="secondary"
                    style={{ fontSize: '11px', display: 'block', textAlign: 'center', marginTop: '8px' }}
                  >
                    Punch in at {mockAttendanceToday.punchInAt}
                  </Text>
                </div>
              </Col>

              <Col span={12}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {/* Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Card
                      size="small"
                      style={{ background: '#1e293b', border: 'none', borderRadius: '6px' }}
                      bodyStyle={{ padding: '12px' }}
                    >
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', display: 'block' }}>
                        Total Hours Today
                      </Text>
                      <Text strong style={{ color: 'white', fontSize: '16px', display: 'block' }}>
                        8.36
                      </Text>
                      <Text style={{ color: 'white', fontSize: '10px' }}>/ 9</Text>
                    </Card>
                    <Card
                      size="small"
                      style={{ background: '#1e293b', border: 'none', borderRadius: '6px' }}
                      bodyStyle={{ padding: '12px' }}
                    >
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', display: 'block' }}>
                        Total Hours Week
                      </Text>
                      <Text strong style={{ color: 'white', fontSize: '16px', display: 'block' }}>
                        35.426
                      </Text>
                      <Text style={{ color: 'white', fontSize: '10px' }}>/ 40</Text>
                    </Card>
                    <Card
                      size="small"
                      style={{ background: '#0693e3', border: 'none', borderRadius: '6px' }}
                      bodyStyle={{ padding: '12px' }}
                    >
                      <Text style={{ color: 'white', fontSize: '11px', display: 'block' }}>
                        Total Hours Month
                      </Text>
                      <Text strong style={{ color: 'white', fontSize: '16px', display: 'block' }}>
                        126
                      </Text>
                      <Text style={{ color: 'white', fontSize: '10px' }}>/ 160</Text>
                    </Card>
                    <Card
                      size="small"
                      style={{ background: '#ec4899', border: 'none', borderRadius: '6px' }}
                      bodyStyle={{ padding: '12px' }}
                    >
                      <Text style={{ color: 'white', fontSize: '11px', display: 'block' }}>
                        Overtime this Month
                      </Text>
                      <Text strong style={{ color: 'white', fontSize: '16px', display: 'block' }}>
                        16
                      </Text>
                      <Text style={{ color: 'white', fontSize: '10px' }}>/ 28</Text>
                    </Card>
                  </div>

                  {/* Working Hours Breakdown */}
                  <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Space>
                          <Badge color="#00d084" />
                          <Text style={{ fontSize: '12px' }}>Total Working hours</Text>
                        </Space>
                        <Text strong style={{ fontSize: '12px' }}>{mockAttendanceToday.totalWorkingHours}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Space>
                          <Badge color="#1e293b" />
                          <Text style={{ fontSize: '12px' }}>Production Hours</Text>
                        </Space>
                        <Text strong style={{ fontSize: '12px' }}>{mockAttendanceToday.productionHours}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Space>
                          <Badge color="#fbbf24" />
                          <Text style={{ fontSize: '12px' }}>Break hours</Text>
                        </Space>
                        <Text strong style={{ fontSize: '12px' }}>{mockAttendanceToday.breakHours}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Space>
                          <Badge color="#0693e3" />
                          <Text style={{ fontSize: '12px' }}>Overtime</Text>
                        </Space>
                        <Text strong style={{ fontSize: '12px' }}>{mockAttendanceToday.overtimeHours}</Text>
                      </div>
                    </div>

                    {/* Timeline visualization */}
                    <div style={{ display: 'flex', height: '20px', gap: '2px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ flex: 5, background: '#00d084' }} />
                      <div style={{ flex: 1, background: '#fbbf24' }} />
                      <div style={{ flex: 5, background: '#00d084' }} />
                      <div style={{ flex: 1, background: '#fbbf24' }} />
                      <div style={{ flex: 3, background: '#0693e3' }} />
                      <div style={{ flex: 1, background: '#fbbf24' }} />
                      <div style={{ flex: 1, background: '#0693e3' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '10px' }}>:00</Text>
                      <Text type="secondary" style={{ fontSize: '10px' }}>07:00</Text>
                      <Text type="secondary" style={{ fontSize: '10px' }}>08:00</Text>
                      <Text type="secondary" style={{ fontSize: '10px' }}>09:00</Text>
                      {[...Array(6)].map((_, i) => (
                        <Text key={i} type="secondary" style={{ fontSize: '10px' }}>
                          {10 + i}:00
                        </Text>
                      ))}
                      <Text type="secondary" style={{ fontSize: '10px' }}>09:0</Text>
                    </div>
                  </div>

                  {/* Comparison Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div style={{ textAlign: 'center', padding: '8px', background: '#fee2e2', borderRadius: '6px' }}>
                      <Text style={{ color: '#cf2e2e', fontSize: '11px', display: 'block' }}>
                        15% by Yesterday
                      </Text>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', background: '#dcfce7', borderRadius: '6px' }}>
                      <Text style={{ color: '#00d084', fontSize: '11px', display: 'block' }}>
                        15% by Last Week
                      </Text>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', background: '#fee2e2', borderRadius: '6px' }}>
                      <Text style={{ color: '#cf2e2e', fontSize: '11px', display: 'block' }}>
                        21% by Last Month
                      </Text>
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Projects and Tasks Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col span={12}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '14px' }}>Projects</Text>
                    <Text type="secondary" style={{ fontSize: '12px', cursor: 'pointer' }}>Ongoing Projects</Text>
                  </div>
                }
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}
                bodyStyle={{ padding: '16px' }}
              >
                <List
                  dataSource={mockProjects}
                  renderItem={(project) => (
                    <div
                      style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text strong style={{ fontSize: '13px' }}>{project.name}</Text>
                        <MoreOutlined style={{ cursor: 'pointer' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Avatar size={24} style={{ background: '#3B82F6', fontSize: '10px' }}>
                          {project.projectLeader.avatar}
                        </Avatar>
                        <div>
                          <Text style={{ fontSize: '11px', display: 'block' }}>{project.projectLeader.name}</Text>
                          <Text type="secondary" style={{ fontSize: '10px' }}>Project Leader</Text>
                        </div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <Space size={4}>
                            <CalendarOutlined style={{ fontSize: '11px', color: '#ff6900' }} />
                            <Text style={{ fontSize: '11px' }}>{project.deadline}</Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: '10px' }}>{project.deadlineType}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <Space size={4}>
                            <CheckCircleOutlined style={{ fontSize: '11px', color: '#00d084' }} />
                            <Text style={{ fontSize: '11px' }}>
                              Tasks: <strong>{project.tasks.completed}/{project.tasks.total}</strong>
                            </Text>
                          </Space>
                          <Avatar.Group size={20} maxCount={3}>
                            {project.teamMembers.map((member, idx) => (
                              <Avatar
                                key={idx}
                                size={20}
                                style={{ background: '#0693e3', fontSize: '9px' }}
                              >
                                {member}
                              </Avatar>
                            ))}
                          </Avatar.Group>
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#e8e8e8',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          textAlign: 'center',
                        }}
                      >
                        <Text style={{ fontSize: '11px' }}>
                          Time Spent: <strong>{project.timeSpent}</strong>
                        </Text>
                      </div>
                    </div>
                  )}
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '14px' }}>Tasks</Text>
                    <Text type="secondary" style={{ fontSize: '12px', cursor: 'pointer' }}>All Projects</Text>
                  </div>
                }
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}
                bodyStyle={{ padding: '16px' }}
              >
                <List
                  dataSource={mockTasks}
                  renderItem={(task) => (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                        padding: '8px',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <div style={{ width: '4px', height: '32px', background: '#e8e8e8', borderRadius: '2px' }} />
                      <Checkbox checked={task.isCompleted} />
                      <StarOutlined style={{ fontSize: '12px', color: task.isCompleted ? '#fbbf24' : '#d9d9d9' }} />
                      <div style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: '12px',
                            display: 'block',
                            textDecoration: task.isCompleted ? 'line-through' : 'none',
                            color: task.isCompleted ? '#8c8c8c' : '#262626',
                          }}
                        >
                          {task.title}
                        </Text>
                      </div>
                      <Tag
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background:
                            task.status === 'Completed'
                              ? '#dcfce7'
                              : task.status === 'Inprogress'
                              ? '#dbeafe'
                              : '#ffe7ba',
                          color:
                            task.status === 'Completed'
                              ? '#00d084'
                              : task.status === 'Inprogress'
                              ? '#0693e3'
                              : '#ff6900',
                          border: 'none',
                        }}
                      >
                        {task.status}
                      </Tag>
                      <Avatar.Group size={20} maxCount={3}>
                        {task.teamMembers.map((member, idx) => (
                          <Avatar
                            key={idx}
                            size={20}
                            style={{ background: '#ec4899', fontSize: '9px' }}
                          >
                            {member}
                          </Avatar>
                        ))}
                      </Avatar.Group>
                    </div>
                  )}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance and Skills Row */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '14px' }}>Performance</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>2025</Text>
                  </div>
                }
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Title level={2} style={{ margin: 0, fontSize: '36px' }}>
                    {mockPerformance.currentScore}%
                  </Title>
                  <Tag
                    style={{
                      background: '#dcfce7',
                      color: '#00d084',
                      border: '1px solid #00d084',
                      borderRadius: '4px',
                      fontSize: '12px',
                      padding: '2px 8px',
                    }}
                  >
                    +{mockPerformance.lastYearComparison}% vs last years
                  </Tag>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={mockPerformance.monthlyData}>
                    <defs>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d084" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" style={{ fontSize: '11px' }} />
                    <YAxis style={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#00d084"
                      strokeWidth={2}
                      fill="url(#performanceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
                  {mockPerformance.feedback}
                </Text>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '14px' }}>My Skills</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>2025</Text>
                  </div>
                }
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: '16px' }}
              >
                <List
                  dataSource={mockSkills}
                  renderItem={(skill) => (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <Text strong style={{ fontSize: '12px' }}>{skill.name}</Text>
                        <Text style={{ fontSize: '12px', color: '#00d084' }}>{skill.proficiency}%</Text>
                      </div>
                      <Progress
                        percent={skill.proficiency}
                        strokeColor={{
                          '0%': '#ff6900',
                          '100%': '#00d084',
                        }}
                        showInfo={false}
                        strokeWidth={6}
                      />
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        Updated : {skill.lastUpdated}
                      </Text>
                    </div>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={6}>
          {/* Team Birthday */}
          <Card
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              border: 'none',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Text strong style={{ color: 'white', fontSize: '14px', display: 'block', marginBottom: '16px' }}>
              Team Birthday
            </Text>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={80}
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                  marginBottom: '12px',
                  fontSize: '28px',
                }}
              >
                {mockTeamBirthday.avatar}
              </Avatar>
              <Title level={5} style={{ color: 'white', margin: 0, marginBottom: '4px', fontSize: '16px' }}>
                {mockTeamBirthday.name}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '12px' }}>
                {mockTeamBirthday.role}
              </Text>
              <Button
                style={{
                  background: 'linear-gradient(135deg, #ff6900 0%, #ff8534 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  width: '100%',
                  height: '32px',
                  fontWeight: '500',
                }}
              >
                Send Wishes
              </Button>
            </div>
          </Card>

          {/* Leave Policy */}
          <Card
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
              border: 'none',
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong style={{ color: 'white', fontSize: '14px', display: 'block' }}>
                  {mockLeavePolicy.title}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>
                  Last Updated : {mockLeavePolicy.lastUpdated}
                </Text>
              </div>
              <Button
                size="small"
                style={{
                  background: 'white',
                  color: '#064e3b',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '500',
                }}
              >
                View All
              </Button>
            </div>
          </Card>

          {/* Next Holiday */}
          <Card
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              border: 'none',
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong style={{ color: '#78350f', fontSize: '14px', display: 'block' }}>
                  {mockNextHoliday.title}
                </Text>
                <Text style={{ color: '#78350f', fontSize: '11px' }}>
                  {mockNextHoliday.date}
                </Text>
              </div>
              <Button
                size="small"
                style={{
                  background: 'white',
                  color: '#78350f',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '500',
                }}
              >
                View All
              </Button>
            </div>
          </Card>

          {/* Team Members */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: '14px' }}>Team Members</Text>
                <Text type="secondary" style={{ fontSize: '12px', cursor: 'pointer' }}>View All</Text>
              </div>
            }
            style={{ marginBottom: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '16px' }}
          >
            <List
              dataSource={mockTeamMembers}
              renderItem={(member, index) => {
                const gradients = [
                  'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                  'linear-gradient(135deg, #ff6900 0%, #ff8534 100%)',
                  'linear-gradient(135deg, #00d084 0%, #00bfa5 100%)',
                  'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                  'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                ];
                return (
                  <List.Item
                    style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
                    actions={[
                      <PhoneOutlined key="phone" style={{ color: '#8c8c8c', fontSize: '14px', cursor: 'pointer' }} />,
                      <MailOutlined key="mail" style={{ color: '#ff6900', fontSize: '14px', cursor: 'pointer' }} />,
                      <MoreOutlined key="more" style={{ color: '#8c8c8c', fontSize: '14px', cursor: 'pointer' }} />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={36}
                          style={{
                            background: gradients[index % gradients.length],
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          {member.avatar}
                        </Avatar>
                      }
                      title={<Text strong style={{ fontSize: '12px' }}>{member.name}</Text>}
                      description={<Text type="secondary" style={{ fontSize: '11px' }}>{member.role}</Text>}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>

          {/* Notifications */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: '14px' }}>Notifications</Text>
                <Text type="secondary" style={{ fontSize: '12px', cursor: 'pointer' }}>View All</Text>
              </div>
            }
            style={{ marginBottom: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}
          >
            <List
              dataSource={mockNotifications}
              renderItem={(notification, index) => {
                const gradients = [
                  'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                  'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                  'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  'linear-gradient(135deg, #00d084 0%, #00bfa5 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                ];
                return (
                  <div
                    style={{
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <Avatar
                        size={32}
                        style={{
                          background: gradients[index % gradients.length],
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      >
                        {notification.user.avatar}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: '12px' }}>
                          <Text strong>{notification.user.name}</Text> {notification.action}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                          {notification.time}
                        </Text>
                        {notification.attachment && (
                          <div
                            style={{
                              marginTop: '6px',
                              padding: '6px 8px',
                              background: '#f5f5f5',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <FileTextOutlined style={{ fontSize: '11px', color: '#cf2e2e' }} />
                            <Text style={{ fontSize: '11px' }}>{notification.attachment}</Text>
                          </div>
                        )}
                        {notification.actions && (
                          <Space size={4} style={{ marginTop: '6px' }}>
                            <Button
                              size="small"
                              danger
                              style={{
                                fontSize: '10px',
                                height: '24px',
                                padding: '0 12px',
                                background: '#ff6900',
                                border: 'none',
                                borderRadius: '4px',
                              }}
                            >
                              {notification.actions[0]}
                            </Button>
                            <Button
                              size="small"
                              style={{
                                fontSize: '10px',
                                height: '24px',
                                padding: '0 12px',
                                borderRadius: '4px',
                              }}
                            >
                              {notification.actions[1]}
                            </Button>
                          </Space>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </Card>

          {/* Meetings Schedule */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: '14px' }}>Meetings Schedule</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>Today</Text>
              </div>
            }
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '16px' }}
          >
            <List
              dataSource={mockMeetings}
              renderItem={(meeting) => (
                <div
                  style={{
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Badge
                      status={meeting.status === 'upcoming' ? 'processing' : 'default'}
                      style={{ marginTop: '4px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text strong style={{ fontSize: '12px' }}>
                          {meeting.time}
                        </Text>
                        <Badge
                          color={meeting.status === 'upcoming' ? '#ff6900' : '#8c8c8c'}
                          text={
                            <Text style={{ fontSize: '10px' }}>
                              {meeting.status === 'upcoming' ? 'Upcoming' : ''}
                            </Text>
                          }
                        />
                      </div>
                      <Text style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                        {meeting.title}
                      </Text>
                      <Tag
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#f5f5f5',
                          border: 'none',
                        }}
                      >
                        {meeting.department}
                      </Tag>
                    </div>
                  </div>
                </div>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
