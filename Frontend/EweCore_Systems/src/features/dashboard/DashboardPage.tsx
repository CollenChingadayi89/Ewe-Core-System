import {
  Card,
  Col,
  Row,
  Statistic,
  Progress,
  Avatar,
  Button,
  Table,
  Tag,
  List,
  Checkbox,
  Space,
  Typography,
  Badge,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  FileDoneOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import {
  mockDashboardStats,
  mockEmployeesByDepartment,
  mockEmployeeStatus,
  mockAttendanceData,
  mockClockInOut,
  mockTopPerformer,
  mockRecentApprovals,
  mockEmployeesList,
  mockTodoList,
  mockExpensesData,
  mockPettyCashRequests,
  mockLeaveRequests,
  mockApprovalStatistics,
  mockUpcomingLeave,
  mockRecentActivities,
  mockBirthdays,
} from '../../mock/dashboard';

const { Title, Text } = Typography;

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  // Stat Card Component with gradient background support
  const StatCard = ({ title, value, change, trend, icon, iconBg, cardBg }: any) => (
    <Card
      style={{
        background: cardBg || 'white',
        border: 'none',
        borderRadius: '12px',
        boxShadow: cardBg ? '0 4px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: '20px' }}
      hoverable
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = cardBg ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = cardBg ? '0 4px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ color: cardBg ? 'rgba(255,255,255,0.9)' : '#8c8c8c', fontSize: '14px', fontWeight: '500' }}>
            {title}
          </Text>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '12px 0', color: cardBg ? 'white' : '#262626' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
            {change !== undefined && (
              <Text
                style={{
                  fontSize: '12px',
                  color: cardBg ? 'rgba(255,255,255,0.95)' : trend === 'up' ? '#52c41a' : '#ff4d4f',
                  marginLeft: '8px',
                  fontWeight: 'normal',
                }}
              >
                {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {change}%
              </Text>
            )}
          </div>
          <Button
            type="link"
            size="small"
            style={{
              padding: 0,
              color: cardBg ? 'rgba(255,255,255,0.95)' : '#1890ff',
              fontWeight: '500',
            }}
          >
            View Details
          </Button>
        </div>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: cardBg ? 'rgba(255,255,255,0.25)' : iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            color: cardBg ? 'white' : 'white',
            backdropFilter: cardBg ? 'blur(10px)' : 'none',
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ color: '#262626', marginBottom: '4px' }}>
          Admin Dashboard
        </Title>
        <Text type="secondary">Dashboard / Admin Dashboard</Text>
      </div>

      {/* Welcome Card */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #00d084 0%, #00bfa5 50%, #00a88f 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 6px 25px rgba(0, 208, 132, 0.3)',
        }}
        bodyStyle={{ padding: '28px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar
              size={64}
              style={{
                background: 'linear-gradient(135deg, #ff6900 0%, #ff8534 100%)',
                fontSize: '28px',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(255, 105, 0, 0.4)',
              }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <div>
              <Title level={4} style={{ color: 'white', margin: 0, marginBottom: '4px' }}>
                Welcome Back, {user?.name?.split(' ')[0]}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: '14px' }}>
                You have <strong>{mockDashboardStats.pendingApprovals.value}</strong> Pending Approvals &{' '}
                <strong>{mockDashboardStats.leaveRequestsThisMonth.value}</strong> Leave Requests
              </Text>
            </div>
          </div>
          <Space>
            <Button
              type="primary"
              size="large"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              Add Schedule
            </Button>
            <Button
              size="large"
              style={{
                background: 'linear-gradient(135deg, #ff6900 0%, #ff8534 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(255, 105, 0, 0.3)',
              }}
            >
              Add Requests
            </Button>
          </Space>
        </div>
      </Card>

      {/* Top 4 Stat Cards with Vibrant Gradients */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Attendance Overview"
            value={`${mockDashboardStats.attendanceOverview.present}/${mockDashboardStats.attendanceOverview.total}`}
            change={2.1}
            trend="up"
            icon={<TeamOutlined />}
            cardBg="linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Approvals"
            value={mockDashboardStats.pendingApprovals.value}
            change={mockDashboardStats.pendingApprovals.change}
            trend={mockDashboardStats.pendingApprovals.trend}
            icon={<FileDoneOutlined />}
            cardBg="linear-gradient(135deg, #00BFA5 0%, #26C6B8 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Employees"
            value={mockDashboardStats.activeEmployees.value}
            change={mockDashboardStats.activeEmployees.change}
            trend={mockDashboardStats.activeEmployees.trend}
            icon={<UserOutlined />}
            cardBg="linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Leave Requests This Month"
            value={mockDashboardStats.leaveRequestsThisMonth.value}
            change={mockDashboardStats.leaveRequestsThisMonth.change}
            trend={mockDashboardStats.leaveRequestsThisMonth.trend}
            icon={<CalendarOutlined />}
            cardBg="linear-gradient(135deg, #EC4899 0%, #F472B6 100%)"
          />
        </Col>
      </Row>

      {/* Employees by Department & Second Row Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Employees By Department</Text>}
            extra={<Text type="secondary">This Week</Text>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ marginBottom: '24px' }}>
              {mockEmployeesByDepartment.map((dept, index) => {
                const colors = ['#FF6B35', '#00BFA5', '#3B82F6', '#EC4899', '#8B5CF6'];
                return (
                  <div key={dept.department} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text strong>{dept.department}</Text>
                      <Text type="secondary" strong>
                        {dept.count}
                      </Text>
                    </div>
                    <Progress
                      percent={(dept.count / dept.total) * 100}
                      strokeColor={{
                        '0%': colors[index % colors.length],
                        '100%': colors[index % colors.length],
                      }}
                      strokeWidth={10}
                      showInfo={false}
                      trailColor="#f0f0f0"
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #52c41a' }}>
              <Text type="secondary">
                No of Employees Increased by <Text strong style={{ color: '#52c41a' }}>+20%</Text> from last Month
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  border: 'none',
                }}
              >
                <Statistic
                  title={<Text style={{ color: '#78350f', fontWeight: '500' }}>Petty Cash Disbursed</Text>}
                  value={mockDashboardStats.pettyCashDisbursed.value}
                  prefix={<Text style={{ fontSize: '16px', color: '#78350f' }}>ZWG</Text>}
                  suffix={
                    <Text style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600' }}>
                      <ArrowUpOutlined /> {mockDashboardStats.pettyCashDisbursed.change}%
                    </Text>
                  }
                  valueStyle={{ fontSize: '22px', fontWeight: 'bold', color: '#78350f' }}
                />
                <Button type="link" size="small" style={{ padding: 0, marginTop: '8px', color: '#ca8a04', fontWeight: '500' }}>
                  View Transactions
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: 'none',
                }}
              >
                <Statistic
                  title={<Text style={{ color: '#1e3a8a', fontWeight: '500' }}>Expenses This Month</Text>}
                  value={mockDashboardStats.expensesThisMonth.value}
                  prefix={<Text style={{ fontSize: '16px', color: '#1e3a8a' }}>ZWG</Text>}
                  suffix={
                    <Text style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600' }}>
                      <ArrowUpOutlined /> {mockDashboardStats.expensesThisMonth.change}%
                    </Text>
                  }
                  valueStyle={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a8a' }}
                />
                <Button type="link" size="small" style={{ padding: 0, marginTop: '8px', color: '#2563eb', fontWeight: '500' }}>
                  View Expenses
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  border: 'none',
                  height: '100%',
                }}
                bodyStyle={{ padding: '16px' }}
              >
                <Statistic
                  title={<Text style={{ color: '#14532d', fontWeight: '500', fontSize: '13px' }}>New Employees This Month</Text>}
                  value={mockDashboardStats.newEmployeesThisMonth.value}
                  suffix={
                    <Text style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                      <ArrowUpOutlined /> {mockDashboardStats.newEmployeesThisMonth.change}%
                    </Text>
                  }
                  valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#14532d', marginTop: '4px' }}
                />
                <Button type="link" size="small" style={{ padding: 0, marginTop: '4px', color: '#16a34a', fontWeight: '500' }}>
                  View Employees
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                  border: 'none',
                  height: '100%',
                }}
                bodyStyle={{ padding: '16px' }}
              >
                <Statistic
                  title={<Text style={{ color: '#831843', fontWeight: '500', fontSize: '13px' }}>Pending Onboarding</Text>}
                  value={mockDashboardStats.pendingOnboarding.value}
                  valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#831843', marginTop: '4px' }}
                />
                <Button type="link" size="small" style={{ padding: 0, marginTop: '4px', color: '#ec4899', fontWeight: '500' }}>
                  View Candidates
                </Button>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Employee Status, Attendance, Clock-In/Out Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={6}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Employee Status</Text>}
            extra={<Text type="secondary">This Week</Text>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '16px', color: '#8c8c8c' }}>
                Total Employee
              </Text>
              <br />
              <Text strong style={{ fontSize: '36px', color: '#262626' }}>
                {mockEmployeeStatus.totalEmployees}
              </Text>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Progress
                percent={100}
                strokeColor={{
                  '0%': '#FF6B35',
                  '25%': '#00BFA5',
                  '50%': '#3B82F6',
                  '75%': '#EC4899',
                  '100%': '#8B5CF6',
                }}
                strokeWidth={12}
                showInfo={false}
              />
            </div>
            {mockEmployeeStatus.statuses.map((status) => (
              <div key={status.type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Space>
                  <Badge color={status.color} />
                  <Text strong>{status.type}</Text>
                  <Text type="secondary">({status.percentage}%)</Text>
                </Space>
                <Text strong style={{ fontSize: '16px' }}>
                  {status.count}
                </Text>
              </div>
            ))}
            <Button
              type="primary"
              block
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #00BFA5 0%, #00a88f 100%)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                height: '40px',
              }}
            >
              View All Employees
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Attendance Overview</Text>}
            extra={<Text type="secondary">Today</Text>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mockAttendanceData.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {mockAttendanceData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '-120px', marginBottom: '80px' }}>
              <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>{mockAttendanceData.total}</Text>
              <br />
              <Text type="secondary" style={{ fontWeight: '500' }}>Total Attendance</Text>
            </div>
            <div>
              {mockAttendanceData.chartData.map((item) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Space>
                    <Badge color={item.color} />
                    <Text strong>{item.name}</Text>
                  </Space>
                  <Text strong style={{ color: item.color }}>
                    {item.percentage}%
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Clock-In/Out</Text>}
            extra={
              <Space>
                <Text type="secondary">All Departments</Text>
                <Text type="secondary">Today</Text>
              </Space>
            }
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              dataSource={mockClockInOut}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.avatar}
                      </Avatar>
                    }
                    title={<Text strong>{item.name}</Text>}
                    description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.role}</Text>}
                  />
                  <Tag
                    color={item.status === 'in' ? 'success' : 'error'}
                    style={{
                      borderRadius: '6px',
                      padding: '2px 12px',
                      fontWeight: '600',
                      border: 'none',
                      background: item.status === 'in' ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                    }}
                  >
                    {item.status === 'in' ? 'In' : 'Out'}
                  </Tag>
                </List.Item>
              )}
            />
            <Button
              type="link"
              block
              style={{ marginTop: '12px', color: '#1890ff', fontWeight: '500' }}
            >
              View All Attendance
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Top Performer</Text>}
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: 'none',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Avatar
                size={100}
                style={{
                  background: 'linear-gradient(135deg, #00d084 0%, #00bfa5 100%)',
                  marginBottom: '16px',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  boxShadow: '0 6px 20px rgba(0, 208, 132, 0.4)',
                }}
              >
                {mockTopPerformer.avatar}
              </Avatar>
              <div>
                <Text strong style={{ fontSize: '18px', display: 'block', color: '#14532d' }}>
                  {mockTopPerformer.name}
                </Text>
                <Text type="secondary" style={{ fontWeight: '500' }}>{mockTopPerformer.role}</Text>
              </div>
              <div style={{ margin: '24px 0' }}>
                <Text style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Performance
                </Text>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #00d084 0%, #00bfa5 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 208, 132, 0.3)',
                  }}
                >
                  <Text strong style={{ fontSize: '36px', color: 'white' }}>
                    {mockTopPerformer.performance}%
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Approvals, Employees, Todo Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Recent Approval Requests</Text>}
            extra={<a href="#" style={{ color: '#1890ff', fontWeight: '500' }}>View All</a>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              dataSource={mockRecentApprovals}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.avatar}
                      </Avatar>
                    }
                    title={<Text strong>{item.employeeName}</Text>}
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                          {item.requestType} - {item.details}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{item.submittedDate}</Text>
                      </div>
                    }
                  />
                  <Tag
                    color={item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'error'}
                    style={{
                      borderRadius: '6px',
                      padding: '2px 12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      border: 'none',
                      background:
                        item.status === 'approved'
                          ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                          : item.status === 'pending'
                          ? 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)'
                          : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                    }}
                  >
                    {item.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Employees</Text>}
            extra={<a href="#" style={{ color: '#1890ff', fontWeight: '500' }}>View All</a>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              dataSource={mockEmployeesList}
              renderItem={(item, index) => {
                const gradients = [
                  'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
                  'linear-gradient(135deg, #00BFA5 0%, #26C6B8 100%)',
                  'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                  'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                ];
                return (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            background: gradients[index % gradients.length],
                            fontWeight: 'bold',
                          }}
                        >
                          {item.avatar}
                        </Avatar>
                      }
                      title={<Text strong>{item.name}</Text>}
                      description={<Text type="secondary">{item.department}</Text>}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Todo</Text>}
            extra={<Text type="secondary">Today</Text>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              dataSource={mockTodoList}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: 'none' }}>
                  <Checkbox style={{ fontSize: '14px' }}>{item.title}</Checkbox>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Expenses & Petty Cash Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Expenses Overview</Text>}
            extra={
              <Space>
                <Text type="secondary">By Category</Text>
                <Text type="secondary">September</Text>
              </Space>
            }
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Space size="large" wrap>
                <Space>
                  <Badge
                    color="#FF6B35"
                    style={{ width: '12px', height: '12px', borderRadius: '50%' }}
                  />
                  <Text>Travel</Text>
                  <Text strong style={{ color: '#FF6B35' }}>ZWG 57K</Text>
                </Space>
                <Space>
                  <Badge
                    color="#3B82F6"
                    style={{ width: '12px', height: '12px', borderRadius: '50%' }}
                  />
                  <Text>Supplies</Text>
                  <Text strong style={{ color: '#3B82F6' }}>ZWG 39K</Text>
                </Space>
                <Space>
                  <Badge
                    color="#00BFA5"
                    style={{ width: '12px', height: '12px', borderRadius: '50%' }}
                  />
                  <Text>Utilities</Text>
                  <Text strong style={{ color: '#00BFA5' }}>ZWG 37K</Text>
                </Space>
              </Space>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                Last Updated at 11:30 PM
              </Text>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockExpensesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="travel" fill="#FF6B35" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="supplies" fill="#3B82F6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="utilities" fill="#00BFA5" stackId="a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Petty Cash Requests</Text>}
            extra={
              <Space>
                <Text type="secondary">All Departments</Text>
                <Text type="secondary">This Week</Text>
              </Space>
            }
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              dataSource={mockPettyCashRequests}
              renderItem={(item, index) => {
                const gradients = [
                  'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                  'linear-gradient(135deg, #00BFA5 0%, #26C6B8 100%)',
                  'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
                ];
                return (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            background: gradients[index % gradients.length],
                            fontWeight: 'bold',
                          }}
                        >
                          {item.avatar}
                        </Avatar>
                      }
                      title={<Text strong>{item.purpose}</Text>}
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.requestedBy} • {item.department}
                        </Text>
                      }
                    />
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ display: 'block', fontSize: '16px', color: '#262626' }}>
                        ZWG {item.amount.toLocaleString()}
                      </Text>
                      <Tag
                        color={
                          item.status === 'Disbursed' || item.status === 'Reconciled'
                            ? 'success'
                            : item.status === 'Approved'
                            ? 'processing'
                            : 'warning'
                        }
                        style={{
                          borderRadius: '6px',
                          padding: '2px 12px',
                          fontWeight: '600',
                          border: 'none',
                          background:
                            item.status === 'Disbursed' || item.status === 'Reconciled'
                              ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                              : item.status === 'Approved'
                              ? 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'
                              : 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                        }}
                      >
                        {item.status}
                      </Tag>
                    </div>
                  </List.Item>
                );
              }}
            />
            <Button
              type="primary"
              block
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                height: '40px',
              }}
            >
              View All
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Leave Requests & Approval Statistics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Leave Requests</Text>}
            extra={<Text type="secondary">September</Text>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <Table
              dataSource={mockLeaveRequests}
              pagination={false}
              size="small"
              columns={[
                {
                  title: <Text strong>ID</Text>,
                  dataIndex: 'id',
                  key: 'id',
                },
                {
                  title: <Text strong>Employee</Text>,
                  dataIndex: 'employee',
                  key: 'employee',
                },
                {
                  title: <Text strong>Department</Text>,
                  dataIndex: 'department',
                  key: 'department',
                },
                {
                  title: <Text strong>Type</Text>,
                  dataIndex: 'leaveType',
                  key: 'leaveType',
                },
                {
                  title: <Text strong>Start Date</Text>,
                  dataIndex: 'startDate',
                  key: 'startDate',
                },
                {
                  title: <Text strong>Days</Text>,
                  dataIndex: 'days',
                  key: 'days',
                },
                {
                  title: <Text strong>Status</Text>,
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag
                      color={status === 'Approved' ? 'success' : status === 'Pending' ? 'warning' : 'error'}
                      style={{
                        borderRadius: '6px',
                        padding: '2px 12px',
                        fontWeight: '600',
                        border: 'none',
                        background:
                          status === 'Approved'
                            ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                            : status === 'Pending'
                            ? 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)'
                            : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                      }}
                    >
                      {status}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Approval Statistics</Text>}
            extra={<Text type="secondary">This Week</Text>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '150px',
                  height: '150px',
                  margin: '0 auto',
                  position: 'relative',
                }}
              >
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={mockApprovalStatistics.breakdown}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {mockApprovalStatistics.breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <Text strong style={{ fontSize: '28px', display: 'block', color: '#262626' }}>
                    {mockApprovalStatistics.completed}/{mockApprovalStatistics.total}
                  </Text>
                </div>
              </div>
            </div>
            <div>
              {mockApprovalStatistics.breakdown.map((item) => (
                <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Space>
                    <Badge color={item.color} />
                    <Text strong>{item.type}</Text>
                  </Space>
                  <Text strong style={{ color: item.color }}>
                    {item.percentage}%
                  </Text>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Text strong style={{ color: 'white', display: 'block', fontSize: '16px' }}>
                {mockApprovalStatistics.totalThisWeek} Approvals
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                {mockApprovalStatistics.processedText}
              </Text>
              <Button
                size="small"
                style={{
                  marginTop: '12px',
                  background: 'white',
                  color: '#3B82F6',
                  border: 'none',
                  fontWeight: '500',
                  borderRadius: '6px',
                }}
              >
                View All
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Upcoming Leave, Activities, Birthdays Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Upcoming Leave</Text>}
            extra={<a href="#" style={{ color: '#1890ff', fontWeight: '500' }}>View All</a>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              dataSource={mockUpcomingLeave}
              renderItem={(item, index) => {
                const gradients = [
                  'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                  'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                ];
                return (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <Avatar
                        style={{
                          marginRight: '12px',
                          background: gradients[index % gradients.length],
                          fontWeight: 'bold',
                        }}
                      >
                        {item.avatar}
                      </Avatar>
                      <div>
                        <Text strong style={{ display: 'block' }}>
                          {item.employeeName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.department}
                        </Text>
                      </div>
                    </div>
                    <Tag
                      color="processing"
                      style={{
                        marginBottom: '12px',
                        borderRadius: '6px',
                        padding: '4px 12px',
                        fontWeight: '600',
                        border: 'none',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                      }}
                    >
                      {item.leaveType}
                    </Tag>
                    <div style={{ marginBottom: '8px' }}>
                      <CalendarOutlined style={{ color: '#3B82F6' }} />{' '}
                      <Text type="secondary">
                        {item.startDate} - {item.endDate}
                      </Text>
                    </div>
                    <Text strong style={{ fontSize: '12px', color: '#3B82F6' }}>
                      {item.days} days
                    </Text>
                  </div>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Recent Activities</Text>}
            extra={<a href="#" style={{ color: '#1890ff', fontWeight: '500' }}>View All</a>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              dataSource={mockRecentActivities}
              renderItem={(item, index) => {
                const gradients = [
                  'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
                  'linear-gradient(135deg, #00BFA5 0%, #26C6B8 100%)',
                  'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                ];
                return (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            background: gradients[index % gradients.length],
                            fontWeight: 'bold',
                          }}
                        >
                          {item.avatar}
                        </Avatar>
                      }
                      title={
                        <Text>
                          <Text strong>{item.name}</Text> {item.action}
                        </Text>
                      }
                      description={
                        <div>
                          {item.target && (
                            <Text style={{ fontSize: '12px', display: 'block' }}>{item.target}</Text>
                          )}
                          <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                            {item.time}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: '16px' }}>Birthdays</Text>}
            extra={<a href="#" style={{ color: '#1890ff', fontWeight: '500' }}>View All</a>}
            style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              dataSource={mockBirthdays}
              renderItem={(item, index) => {
                const gradients = [
                  'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                  'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
                ];
                return (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            background: gradients[index % gradients.length],
                            fontWeight: 'bold',
                          }}
                        >
                          {item.avatar}
                        </Avatar>
                      }
                      title={<Text strong>{item.name}</Text>}
                      description={<Text type="secondary">{item.role}</Text>}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                        {item.date}
                      </Text>
                      <Button
                        size="small"
                        type="primary"
                        style={{
                          marginTop: '4px',
                          background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '500',
                        }}
                      >
                        Send
                      </Button>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
