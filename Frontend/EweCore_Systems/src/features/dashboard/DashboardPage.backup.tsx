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

  // Stat Card Component
  const StatCard = ({ title, value, change, trend, icon, iconBg }: any) => (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>{title}</Text>
          <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
            {change !== undefined && (
              <Text style={{ fontSize: '12px', color: trend === 'up' ? '#52c41a' : '#ff4d4f', marginLeft: '8px' }}>
                {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {change}%
              </Text>
            )}
          </div>
          <Button type="link" size="small" style={{ padding: 0 }}>
            View Details
          </Button>
        </div>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
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
        <Title level={3}>Admin Dashboard</Title>
        <Text type="secondary">Dashboard / Admin Dashboard</Text>
      </div>

      {/* Welcome Card */}
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #32373c 0%, #00d084 100%)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar size={64} style={{ background: '#ff6900' }}>
              {user?.name?.charAt(0)}
            </Avatar>
            <div>
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                Welcome Back, {user?.name?.split(' ')[0]}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                You have {mockDashboardStats.pendingApprovals.value} Pending Approvals & {mockDashboardStats.leaveRequestsThisMonth.value} Leave Requests
              </Text>
            </div>
          </div>
          <Space>
            <Button type="primary" style={{ background: '#32373c' }}>
              Add Schedule
            </Button>
            <Button style={{ background: '#ff6900', color: 'white', border: 'none' }}>
              Add Requests
            </Button>
          </Space>
        </div>
      </Card>

      {/* Top 4 Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Attendance Overview"
            value={`${mockDashboardStats.attendanceOverview.present}/${mockDashboardStats.attendanceOverview.total}`}
            change={2.1}
            trend="up"
            icon={<TeamOutlined />}
            iconBg="#00d084"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Approvals"
            value={mockDashboardStats.pendingApprovals.value}
            change={mockDashboardStats.pendingApprovals.change}
            trend={mockDashboardStats.pendingApprovals.trend}
            icon={<FileDoneOutlined />}
            iconBg="#0693e3"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Employees"
            value={mockDashboardStats.activeEmployees.value}
            change={mockDashboardStats.activeEmployees.change}
            trend={mockDashboardStats.activeEmployees.trend}
            icon={<UserOutlined />}
            iconBg="#ff6900"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Leave Requests This Month"
            value={mockDashboardStats.leaveRequestsThisMonth.value}
            change={mockDashboardStats.leaveRequestsThisMonth.change}
            trend={mockDashboardStats.leaveRequestsThisMonth.trend}
            icon={<CalendarOutlined />}
            iconBg="#9b51e0"
          />
        </Col>
      </Row>

      {/* Employees by Department & Second Row Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Employees By Department" extra={<Text type="secondary">This Week</Text>}>
            <div style={{ marginBottom: '24px' }}>
              {mockEmployeesByDepartment.map((dept) => (
                <div key={dept.department} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text>{dept.department}</Text>
                    <Text type="secondary">{dept.count}</Text>
                  </div>
                  <Progress percent={(dept.count / dept.total) * 100} strokeColor="#00d084" showInfo={false} />
                </div>
              ))}
            </div>
            <Text type="secondary">
              No of Employees Increased by <Text style={{ color: '#52c41a' }}>+20%</Text> from last Month
            </Text>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Petty Cash Disbursed"
                  value={mockDashboardStats.pettyCashDisbursed.value}
                  prefix="ZWG"
                  suffix={
                    <Text style={{ fontSize: '14px', color: '#52c41a' }}>
                      <ArrowUpOutlined /> {mockDashboardStats.pettyCashDisbursed.change}%
                    </Text>
                  }
                  valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
                />
                <Button type="link" size="small" style={{ padding: 0, marginTop: '8px' }}>
                  View Transactions
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Expenses This Month"
                  value={mockDashboardStats.expensesThisMonth.value}
                  prefix="ZWG"
                  suffix={
                    <Text style={{ fontSize: '14px', color: '#52c41a' }}>
                      <ArrowUpOutlined /> {mockDashboardStats.expensesThisMonth.change}%
                    </Text>
                  }
                  valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
                />
                <Button type="link" size="small" style={{ padding: 0, marginTop: '8px' }}>
                  View Expenses
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="New Employees This Month"
                  value={mockDashboardStats.newEmployeesThisMonth.value}
                  suffix={
                    <Text style={{ fontSize: '14px', color: '#52c41a' }}>
                      <ArrowUpOutlined /> {mockDashboardStats.newEmployeesThisMonth.change}%
                    </Text>
                  }
                  valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
                />
                <Button type="link" size="small" style={{ padding: 0, marginTop: '8px' }}>
                  View Employees
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Pending Onboarding"
                  value={mockDashboardStats.pendingOnboarding.value}
                  valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
                />
                <Button type="link" size="small" style={{ padding: 0, marginTop: '8px' }}>
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
          <Card title="Employee Status" extra={<Text type="secondary">This Week</Text>}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '18px' }}>
                Total Employee
              </Text>
              <br />
              <Text strong style={{ fontSize: '32px' }}>
                {mockEmployeeStatus.totalEmployees}
              </Text>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Progress
                percent={100}
                strokeColor={{
                  '0%': '#ff6900',
                  '81%': '#00d084',
                  '93%': '#cf2e2e',
                  '100%': '#9b51e0',
                }}
                showInfo={false}
              />
            </div>
            {mockEmployeeStatus.statuses.map((status) => (
              <div key={status.type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Space>
                  <Badge color={status.color} />
                  <Text>{status.type} ({status.percentage}%)</Text>
                </Space>
                <Text strong>{status.count}</Text>
              </div>
            ))}
            <Button type="link" style={{ padding: 0, marginTop: '12px' }}>
              View All Employees
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Attendance Overview" extra={<Text type="secondary">Today</Text>}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mockAttendanceData.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {mockAttendanceData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '-120px', marginBottom: '80px' }}>
              <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{mockAttendanceData.total}</Text>
              <br />
              <Text type="secondary">Total Attendance</Text>
            </div>
            <div>
              {mockAttendanceData.chartData.map((item) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Space>
                    <Badge color={item.color} />
                    <Text>{item.name}</Text>
                  </Space>
                  <Text>{item.percentage}%</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title="Clock-In/Out"
            extra={
              <Space>
                <Text type="secondary">All Departments</Text>
                <Text type="secondary">Today</Text>
              </Space>
            }
          >
            <List
              dataSource={mockClockInOut}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar>{item.avatar}</Avatar>}
                    title={<Text strong>{item.name}</Text>}
                    description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.role}</Text>}
                  />
                  <Tag color={item.status === 'in' ? 'green' : 'red'}>{item.status === 'in' ? 'In' : 'Out'}</Tag>
                </List.Item>
              )}
            />
            <Button type="link" block style={{ marginTop: '8px' }}>
              View All Attendance
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Top Performer">
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Avatar size={80} style={{ background: '#00d084', marginBottom: '16px' }}>
                {mockTopPerformer.avatar}
              </Avatar>
              <div>
                <Text strong style={{ fontSize: '16px', display: 'block' }}>
                  {mockTopPerformer.name}
                </Text>
                <Text type="secondary">{mockTopPerformer.role}</Text>
              </div>
              <div style={{ margin: '24px 0' }}>
                <Text style={{ fontSize: '14px', color: '#00d084' }}>Performance</Text>
                <div>
                  <Text strong style={{ fontSize: '32px' }}>
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
          <Card title="Recent Approval Requests" extra={<a href="#">View All</a>}>
            <List
              dataSource={mockRecentApprovals}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{item.avatar}</Avatar>}
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
                  <Tag color={item.status === 'approved' ? 'green' : item.status === 'pending' ? 'orange' : 'red'}>
                    {item.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Employees" extra={<a href="#">View All</a>}>
            <List
              dataSource={mockEmployeesList}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{item.avatar}</Avatar>}
                    title={<Text strong>{item.name}</Text>}
                    description={<Text type="secondary">{item.department}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Todo" extra={<Text type="secondary">Today</Text>}>
            <List
              dataSource={mockTodoList}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 0', borderBottom: 'none' }}>
                  <Checkbox>{item.title}</Checkbox>
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
            title="Expenses Overview"
            extra={
              <Space>
                <Text type="secondary">By Category</Text>
                <Text type="secondary">September</Text>
              </Space>
            }
          >
            <div style={{ marginBottom: '16px' }}>
              <Space size="large" wrap>
                <Space>
                  <Badge color="#ff6900" />
                  <Text>Travel</Text>
                  <Text strong>ZWG 57K</Text>
                </Space>
                <Space>
                  <Badge color="#32373c" />
                  <Text>Supplies</Text>
                  <Text strong>ZWG 39K</Text>
                </Space>
                <Space>
                  <Badge color="#0693e3" />
                  <Text>Utilities</Text>
                  <Text strong>ZWG 37K</Text>
                </Space>
              </Space>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                Last Updated at 11:30 PM
              </Text>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockExpensesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="travel" fill="#ff6900" stackId="a" />
                <Bar dataKey="supplies" fill="#32373c" stackId="a" />
                <Bar dataKey="utilities" fill="#0693e3" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Petty Cash Requests"
            extra={
              <Space>
                <Text type="secondary">All Departments</Text>
                <Text type="secondary">This Week</Text>
              </Space>
            }
          >
            <List
              dataSource={mockPettyCashRequests}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{item.avatar}</Avatar>}
                    title={<Text strong>{item.purpose}</Text>}
                    description={
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {item.requestedBy} • {item.department}
                      </Text>
                    }
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ display: 'block' }}>
                      ZWG {item.amount.toLocaleString()}
                    </Text>
                    <Tag color={item.status === 'Disbursed' || item.status === 'Reconciled' ? 'green' : item.status === 'Approved' ? 'blue' : 'orange'}>
                      {item.status}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
            <Button type="link" block style={{ marginTop: '8px' }}>
              View All
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Leave Requests & Approval Statistics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="Leave Requests" extra={<Text type="secondary">September</Text>}>
            <Table
              dataSource={mockLeaveRequests}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                },
                {
                  title: 'Employee',
                  dataIndex: 'employee',
                  key: 'employee',
                },
                {
                  title: 'Department',
                  dataIndex: 'department',
                  key: 'department',
                },
                {
                  title: 'Type',
                  dataIndex: 'leaveType',
                  key: 'leaveType',
                },
                {
                  title: 'Start Date',
                  dataIndex: 'startDate',
                  key: 'startDate',
                },
                {
                  title: 'Days',
                  dataIndex: 'days',
                  key: 'days',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={status === 'Approved' ? 'green' : status === 'Pending' ? 'orange' : 'red'}>
                      {status}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Approval Statistics" extra={<Text type="secondary">This Week</Text>}>
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
                  <Text strong style={{ fontSize: '24px', display: 'block' }}>
                    {mockApprovalStatistics.completed}/{mockApprovalStatistics.total}
                  </Text>
                </div>
              </div>
            </div>
            <div>
              {mockApprovalStatistics.breakdown.map((item) => (
                <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Space>
                    <Badge color={item.color} />
                    <Text>{item.type}</Text>
                  </Space>
                  <Text>{item.percentage}%</Text>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: '#32373c', borderRadius: '8px' }}>
              <Text strong style={{ color: 'white', display: 'block' }}>
                {mockApprovalStatistics.totalThisWeek} Approvals
              </Text>
              <Text style={{ color: '#aaa', fontSize: '12px' }}>{mockApprovalStatistics.processedText}</Text>
              <Button size="small" style={{ marginTop: '8px' }}>
                View All
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Upcoming Leave, Activities, Birthdays Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Upcoming Leave" extra={<a href="#">View All</a>}>
            <List
              dataSource={mockUpcomingLeave}
              renderItem={(item) => (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <Avatar style={{ marginRight: '12px' }}>{item.avatar}</Avatar>
                    <div>
                      <Text strong style={{ display: 'block' }}>
                        {item.employeeName}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{item.department}</Text>
                    </div>
                  </div>
                  <Tag color="blue" style={{ marginBottom: '8px' }}>
                    {item.leaveType}
                  </Tag>
                  <div style={{ marginBottom: '8px' }}>
                    <CalendarOutlined /> <Text type="secondary">{item.startDate} - {item.endDate}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>{item.days} days</Text>
                </div>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Recent Activities" extra={<a href="#">View All</a>}>
            <List
              dataSource={mockRecentActivities}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar>{item.avatar}</Avatar>}
                    title={
                      <Text>
                        <Text strong>{item.name}</Text> {item.action}
                      </Text>
                    }
                    description={
                      <div>
                        {item.target && <Text style={{ fontSize: '12px' }}>{item.target}</Text>}
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>{item.time}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Birthdays" extra={<a href="#">View All</a>}>
            <List
              dataSource={mockBirthdays}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{item.avatar}</Avatar>}
                    title={<Text strong>{item.name}</Text>}
                    description={<Text type="secondary">{item.role}</Text>}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                      {item.date}
                    </Text>
                    <Button size="small" type="primary" style={{ marginTop: '4px', background: '#32373c' }}>
                      Send
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
