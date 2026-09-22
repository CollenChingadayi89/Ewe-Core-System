import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Input,
  message,
  Modal,
  Tag,
  Space,
  Typography,
  Alert,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  UsergroupAddOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, DataTable } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import employeeApi from '../../services/api/employeeApi';

const { TextArea } = Input;
const { Title, Text } = Typography;

// ============================================================================
// INTERFACES
// ============================================================================

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  department: string;
  designation: string;
}

interface LeavePolicy {
  id: string;
  code: string;
  leave_type: string;
  display_name: string;
  annual_entitlement_days: number;
}

interface LeaveTransaction {
  id: string;
  transaction_number: string;
  employee: string;
  employee_name: string;
  employee_number: string;
  leave_policy: string;
  leave_type_name: string;
  transaction_type: string;
  transaction_date: string;
  days: number;
  balance_after: number;
  notes: string;
  processed_by_name: string;
  created_at: string;
}

interface EmployeeBalance {
  employee_id: string;
  employee_name: string;
  employee_number: string;
  leave_policy_id: string;
  leave_type_name: string;
  total_accrued: number;
  total_used: number;
  available_balance: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LeaveBalancesPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('balances');
  const [form] = Form.useForm();

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [transactions, setTransactions] = useState<LeaveTransaction[]>([]);
  const [balances, setBalances] = useState<EmployeeBalance[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [balancesLoading, setBalancesLoading] = useState(false);

  // UI states
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filterLeaveType, setFilterLeaveType] = useState<string>('');
  const [filterEmployee, setFilterEmployee] = useState<string>('');

  // Custom policies modal states
  const [customPoliciesModalVisible, setCustomPoliciesModalVisible] = useState(false);
  const [customPolicyDays, setCustomPolicyDays] = useState<Record<string, number>>({});
  const [selectedCustomPolicies, setSelectedCustomPolicies] = useState<string[]>([]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchEmployees();
    fetchPolicies();
    fetchTransactions();
  }, []);

  // Fetch balances only after employees and policies are loaded
  useEffect(() => {
    if (employees.length > 0 && policies.length > 0) {
      const loadBalances = async () => {
        setBalancesLoading(true);
        try {
          const allBalances: EmployeeBalance[] = [];

          for (const employee of employees) {
            for (const policy of policies) {
              try {
                const balance = await employeeApi.leaveBalance.get({
                  employee: employee.id,
                  leave_policy: policy.id,
                });

                if (balance.total_accrued > 0 || balance.total_used > 0) {
                  allBalances.push({
                    employee_id: employee.id,
                    employee_name: employee.full_name || `${employee.first_name} ${employee.last_name}`,
                    employee_number: employee.employee_number,
                    leave_policy_id: policy.id,
                    leave_type_name: policy.display_name,
                    total_accrued: balance.total_accrued,
                    total_used: balance.total_used,
                    available_balance: balance.available_balance,
                  });
                }
              } catch (error) {
                // Skip if no balance exists for this employee/policy combo
                console.log(`No balance for ${employee.employee_number} - ${policy.display_name}`);
              }
            }
          }

          setBalances(allBalances);
        } catch (error) {
          console.error('Failed to fetch balances:', error);
          message.error('Failed to load leave balances');
        } finally {
          setBalancesLoading(false);
        }
      };

      loadBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, policies]);

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const response = await employeeApi.employees.list({ page_size: 1000, is_active: true });
      setEmployees(response.results || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      message.error('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await employeeApi.leavePolicies.list({ is_active: true, page_size: 100 });
      setPolicies(response.results || []);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
      message.error('Failed to load leave policies');
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const response = await employeeApi.leaveTransactions.list({
        page_size: 1000,
        ordering: '-transaction_date,-created_at'
      });
      setTransactions(response.results || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      message.error('Failed to load transaction history');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchBalances = async () => {
    setBalancesLoading(true);
    try {
      // Fetch balances for all employees and policies
      const allBalances: EmployeeBalance[] = [];

      for (const employee of employees) {
        for (const policy of policies) {
          try {
            const balance = await employeeApi.leaveBalance.get({
              employee: employee.id,
              leave_policy: policy.id,
            });

            if (balance.total_accrued > 0 || balance.total_used > 0) {
              allBalances.push({
                employee_id: employee.id,
                employee_name: employee.full_name || `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number,
                leave_policy_id: policy.id,
                leave_type_name: policy.display_name,
                total_accrued: balance.total_accrued,
                total_used: balance.total_used,
                available_balance: balance.available_balance,
              });
            }
          } catch (error) {
            // Skip if no balance exists
          }
        }
      }

      setBalances(allBalances);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setBalancesLoading(false);
    }
  };

  // ============================================================================
  // FILTERED DATA & CHARTS
  // ============================================================================

  // Filter balances based on search and filter criteria
  const filteredBalances = balances.filter((balance) => {
    const matchesSearch = searchText
      ? balance.employee_name.toLowerCase().includes(searchText.toLowerCase()) ||
        balance.employee_number.toLowerCase().includes(searchText.toLowerCase())
      : true;

    const matchesLeaveType = filterLeaveType
      ? balance.leave_type_name === filterLeaveType
      : true;

    const matchesEmployee = filterEmployee
      ? balance.employee_id === filterEmployee
      : true;

    return matchesSearch && matchesLeaveType && matchesEmployee;
  });

  // Prepare chart data - Leave balance by type
  const leaveByTypeData = balances.reduce((acc: any[], balance) => {
    const existing = acc.find(item => item.name === balance.leave_type_name);
    if (existing) {
      existing.total_accrued += balance.total_accrued;
      existing.total_used += balance.total_used;
      existing.available_balance += balance.available_balance;
    } else {
      acc.push({
        name: balance.leave_type_name,
        total_accrued: balance.total_accrued,
        total_used: balance.total_used,
        available_balance: balance.available_balance,
      });
    }
    return acc;
  }, []);

  // Prepare pie chart data - Total days distribution
  const totalAccrued = balances.reduce((sum, b) => sum + b.total_accrued, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.total_used, 0);
  const totalAvailable = balances.reduce((sum, b) => sum + b.available_balance, 0);

  const pieChartData = [
    { name: 'Total Accrued', value: totalAccrued, color: '#52c41a' },
    { name: 'Total Used', value: totalUsed, color: '#fa8c16' },
    { name: 'Available', value: totalAvailable, color: '#1890ff' },
  ];

  // Top employees by leave balance
  const topEmployeesData = balances
    .reduce((acc: any[], balance) => {
      const existing = acc.find(item => item.employee_id === balance.employee_id);
      if (existing) {
        existing.total_balance += balance.available_balance;
      } else {
        acc.push({
          employee_id: balance.employee_id,
          name: balance.employee_name,
          total_balance: balance.available_balance,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.total_balance - a.total_balance)
    .slice(0, 10);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBulkAccrual = async (values: any) => {
    if (selectedEmployees.length === 0) {
      message.error('Please select at least one employee');
      return;
    }

    if (selectedPolicies.length === 0) {
      message.error('Please select at least one leave policy');
      return;
    }

    setLoading(true);
    try {
      let totalCreated = 0;
      const allErrors: any[] = [];
      const allocatedPolicies: string[] = [];

      // Loop through each selected leave policy
      for (const policyId of selectedPolicies) {
        const policy = policies.find(p => p.id === policyId);

        if (!policy) {
          allErrors.push({
            policy_name: policyId,
            error: 'Policy not found',
          });
          continue;
        }

        try {
          // AUTO-FILL days from policy configuration
          const result = await employeeApi.leaveTransactions.bulkAccrual({
            employee_ids: selectedEmployees,
            leave_policy: policyId,
            days: policy.annual_entitlement_days, // Use policy's configured days
            transaction_date: values.transaction_date ? values.transaction_date.format('YYYY-MM-DD') : undefined,
            notes: values.notes,
          });

          totalCreated += result.created_count;
          allocatedPolicies.push(`${policy.display_name} (${policy.annual_entitlement_days} days)`);

          if (result.errors && result.errors.length > 0) {
            allErrors.push(...result.errors);
          }
        } catch (error: any) {
          const policyName = policy.display_name || policyId;
          allErrors.push({
            policy_name: policyName,
            error: error?.response?.data?.detail || 'Failed to create allocation',
          });
        }
      }

      // Show success/partial success message
      if (allErrors.length === 0) {
        Modal.success({
          title: 'Leave Allocation Successful',
          content: (
            <div>
              <p>Successfully allocated leave to {selectedEmployees.length} employee(s):</p>
              <ul>
                {allocatedPolicies.map((policyInfo, idx) => (
                  <li key={idx}>{policyInfo}</li>
                ))}
              </ul>
              <p style={{ marginTop: 16 }}>Total transactions created: {totalCreated}</p>
            </div>
          ),
        });
        form.resetFields();
        setSelectedEmployees([]);
        setSelectedPolicies([]);
        fetchTransactions();
        fetchBalances();
      } else {
        Modal.warning({
          title: 'Bulk Allocation Result',
          content: (
            <div>
              {allocatedPolicies.length > 0 && (
                <>
                  <p><strong>Successfully allocated:</strong></p>
                  <ul>
                    {allocatedPolicies.map((policyInfo, idx) => (
                      <li key={idx}>{policyInfo}</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: 8 }}>Created {totalCreated} transactions</p>
                </>
              )}
              {allErrors.length > 0 && (
                <>
                  <p style={{ marginTop: 16 }}><strong>Errors ({allErrors.length}):</strong></p>
                  <ul>
                    {allErrors.map((err: any, idx: number) => (
                      <li key={idx}>
                        {err.employee_name ? `${err.employee_name}: ${err.error}` : err.error}
                        {err.policy_name && ` (${err.policy_name})`}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ),
        });
        fetchTransactions();
        fetchBalances();
      }
    } catch (error: any) {
      console.error('Failed to create bulk accrual:', error);
      message.error(error?.response?.data?.detail || 'Failed to create leave allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomPolicies = () => {
    if (selectedEmployees.length === 0) {
      message.error('Please select at least one employee first');
      return;
    }

    // Initialize custom days with default values from policies
    const initialDays: Record<string, number> = {};
    const initialSelected: string[] = [];

    policies.forEach(p => {
      initialDays[p.id] = p.annual_entitlement_days;
      initialSelected.push(p.id); // Select all policies by default
    });

    setCustomPolicyDays(initialDays);
    setSelectedCustomPolicies(initialSelected);
    setCustomPoliciesModalVisible(true);
  };

  const handleCustomAllocation = async (values: any) => {
    if (selectedCustomPolicies.length === 0) {
      message.error('Please select at least one leave policy');
      return;
    }

    setLoading(true);
    try {
      let totalCreated = 0;
      const allErrors: any[] = [];
      const allocatedPolicies: string[] = [];

      // Loop through each selected leave policy with custom days
      for (const policyId of selectedCustomPolicies) {
        const policy = policies.find(p => p.id === policyId);
        const customDays = customPolicyDays[policyId];

        if (!policy) {
          allErrors.push({
            policy_name: policyId,
            error: 'Policy not found',
          });
          continue;
        }

        if (customDays <= 0) {
          allErrors.push({
            policy_name: policy.display_name,
            error: 'Days must be greater than 0',
          });
          continue;
        }

        try {
          // Use CUSTOM days instead of policy's default
          const result = await employeeApi.leaveTransactions.bulkAccrual({
            employee_ids: selectedEmployees,
            leave_policy: policyId,
            days: customDays, // Use custom days
            notes: values.notes,
          });

          totalCreated += result.created_count;
          allocatedPolicies.push(`${policy.display_name} (${customDays} days)`);

          if (result.errors && result.errors.length > 0) {
            allErrors.push(...result.errors);
          }
        } catch (error: any) {
          const policyName = policy.display_name || policyId;
          allErrors.push({
            policy_name: policyName,
            error: error?.response?.data?.detail || 'Failed to create allocation',
          });
        }
      }

      // Show success/partial success message
      if (allErrors.length === 0) {
        Modal.success({
          title: 'Custom Leave Allocation Successful',
          content: (
            <div>
              <p>Successfully allocated custom leave to {selectedEmployees.length} employee(s):</p>
              <ul>
                {allocatedPolicies.map((policyInfo, idx) => (
                  <li key={idx}>{policyInfo}</li>
                ))}
              </ul>
              <p style={{ marginTop: 16 }}>Total transactions created: {totalCreated}</p>
            </div>
          ),
        });

        // Close modal and reset
        setCustomPoliciesModalVisible(false);
        setCustomPolicyDays({});
        setSelectedCustomPolicies([]);
        fetchTransactions();
        fetchBalances();
      } else {
        Modal.warning({
          title: 'Custom Allocation Result',
          content: (
            <div>
              {allocatedPolicies.length > 0 && (
                <>
                  <p><strong>Successfully allocated:</strong></p>
                  <ul>
                    {allocatedPolicies.map((policyInfo, idx) => (
                      <li key={idx}>{policyInfo}</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: 8 }}>Created {totalCreated} transactions</p>
                </>
              )}
              {allErrors.length > 0 && (
                <>
                  <p style={{ marginTop: 16 }}><strong>Errors ({allErrors.length}):</strong></p>
                  <ul>
                    {allErrors.map((err: any, idx: number) => (
                      <li key={idx}>
                        {err.employee_name ? `${err.employee_name}: ${err.error}` : err.error}
                        {err.policy_name && ` (${err.policy_name})`}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ),
        });
        fetchTransactions();
        fetchBalances();
      }
    } catch (error: any) {
      console.error('Failed to create custom allocation:', error);
      message.error(error?.response?.data?.detail || 'Failed to create custom leave allocations');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const balanceColumns: ColumnsType<EmployeeBalance> = [
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
      sorter: (a, b) => a.employee_name.localeCompare(b.employee_name),
    },
    {
      title: 'Employee #',
      dataIndex: 'employee_number',
      key: 'employee_number',
      width: 150,
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type_name',
      key: 'leave_type_name',
      filters: [...new Set(balances.map(b => b.leave_type_name))].map(name => ({ text: name, value: name })),
      onFilter: (value, record) => record.leave_type_name === value,
    },
    {
      title: 'Total Accrued',
      dataIndex: 'total_accrued',
      key: 'total_accrued',
      width: 120,
      render: (days) => <Tag color="green">{days} days</Tag>,
      sorter: (a, b) => a.total_accrued - b.total_accrued,
    },
    {
      title: 'Total Used',
      dataIndex: 'total_used',
      key: 'total_used',
      width: 120,
      render: (days) => <Tag color="orange">{days} days</Tag>,
      sorter: (a, b) => a.total_used - b.total_used,
    },
    {
      title: 'Available Balance',
      dataIndex: 'available_balance',
      key: 'available_balance',
      width: 150,
      render: (days) => (
        <Tag color={days > 0 ? 'blue' : days < 0 ? 'red' : 'default'}>
          {days} days
        </Tag>
      ),
      sorter: (a, b) => a.available_balance - b.available_balance,
    },
  ];

  const transactionColumns: ColumnsType<LeaveTransaction> = [
    {
      title: 'Transaction #',
      dataIndex: 'transaction_number',
      key: 'transaction_number',
      width: 150,
    },
    {
      title: 'Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.transaction_date).unix() - dayjs(b.transaction_date).unix(),
    },
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
      sorter: (a, b) => a.employee_name.localeCompare(b.employee_name),
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type_name',
      key: 'leave_type_name',
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 120,
      render: (type) => {
        const colors: Record<string, string> = {
          accrual: 'green',
          usage: 'orange',
          adjustment: 'blue',
          carryforward: 'purple',
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
      filters: [
        { text: 'Accrual', value: 'accrual' },
        { text: 'Usage', value: 'usage' },
        { text: 'Adjustment', value: 'adjustment' },
        { text: 'Carryforward', value: 'carryforward' },
      ],
      onFilter: (value, record) => record.transaction_type === value,
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      width: 100,
      render: (days) => (
        <Text strong style={{ color: days > 0 ? '#52c41a' : '#ff4d4f' }}>
          {days > 0 ? `+${days}` : days}
        </Text>
      ),
      sorter: (a, b) => a.days - b.days,
    },
    {
      title: 'Balance After',
      dataIndex: 'balance_after',
      key: 'balance_after',
      width: 130,
      render: (balance) => <Tag color="blue">{balance} days</Tag>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Processed By',
      dataIndex: 'processed_by_name',
      key: 'processed_by_name',
      width: 150,
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Leave Balance Management"
        subtitle="Initialize leave balances, track allocations, and view transaction history"
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          // ======================================================================
          // TAB 1: EMPLOYEE BALANCES
          // ======================================================================
          {
            key: 'balances',
            label: (
              <span>
                <InfoCircleOutlined /> Employee Balances
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="Current Leave Balances"
                  description="View all employees' current leave balances across different leave types. Balances are calculated in real-time from transaction history."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {/* Statistics Cards */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Total Employees"
                        value={employees.length}
                        prefix={<UsergroupAddOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Leave Policies"
                        value={policies.length}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Total Allocations"
                        value={balances.length}
                        prefix={<HistoryOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Total Available Days"
                        value={totalAvailable.toFixed(1)}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Visual Charts */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={12}>
                    <Card title={<><BarChartOutlined /> Leave Balances by Type</>} size="small">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={leaveByTypeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total_accrued" fill="#52c41a" name="Total Accrued" />
                          <Bar dataKey="total_used" fill="#fa8c16" name="Total Used" />
                          <Bar dataKey="available_balance" fill="#1890ff" name="Available" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title={<><PieChartOutlined /> Leave Days Distribution</>} size="small">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => `${name}: ${value.toFixed(1)} days (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>

                {/* Top Employees Chart */}
                {topEmployeesData.length > 0 && (
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={24}>
                      <Card title={<><UsergroupAddOutlined /> Top 10 Employees by Total Leave Balance</>} size="small">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={topEmployeesData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip />
                            <Bar dataKey="total_balance" fill="#1890ff" name="Total Balance (days)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Search and Filter Controls */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Input
                          placeholder="Search by employee name or number..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          allowClear
                        />
                      </Col>
                      <Col span={8}>
                        <Select
                          placeholder="Filter by Leave Type"
                          value={filterLeaveType || undefined}
                          onChange={(value) => setFilterLeaveType(value || '')}
                          style={{ width: '100%' }}
                          allowClear
                        >
                          {[...new Set(balances.map(b => b.leave_type_name))].map(type => (
                            <Select.Option key={type} value={type}>{type}</Select.Option>
                          ))}
                        </Select>
                      </Col>
                      <Col span={8}>
                        <Select
                          showSearch
                          placeholder="Filter by Employee"
                          value={filterEmployee || undefined}
                          onChange={(value) => setFilterEmployee(value || '')}
                          style={{ width: '100%' }}
                          allowClear
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            (option?.children as string).toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {employees.map(emp => (
                            <Select.Option key={emp.id} value={emp.id}>
                              {emp.full_name || `${emp.first_name} ${emp.last_name}`} ({emp.employee_number})
                            </Select.Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>
                    <div>
                      <Text type="secondary">
                        Showing {filteredBalances.length} of {balances.length} balances
                        {searchText && ` • Search: "${searchText}"`}
                        {filterLeaveType && ` • Leave Type: ${filterLeaveType}`}
                        {filterEmployee && ` • Employee: ${employees.find(e => e.id === filterEmployee)?.employee_number}`}
                      </Text>
                    </div>
                  </Space>
                </Card>

                {/* Balances Table */}
                <DataTable
                  columns={balanceColumns}
                  dataSource={filteredBalances}
                  loading={balancesLoading}
                  rowKey={(record) => `${record.employee_id}-${record.leave_policy_id}`}
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} balances` }}
                />
              </Card>
            ),
          },

          // ======================================================================
          // TAB 2: INITIALIZE BALANCES
          // ======================================================================
          {
            key: 'initialize',
            label: (
              <span>
                <PlusOutlined /> Initialize Balances
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="Bulk Leave Allocation"
                  description="Select employees and leave policies to allocate leave days in bulk. Each policy will automatically allocate its configured annual entitlement days. This creates accrual transactions for each employee-policy combination."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Form form={form} layout="vertical" onFinish={handleBulkAccrual}>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Select Employees"
                        required
                        extra={`${selectedEmployees.length} employee(s) selected`}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Select employees to allocate leave"
                          loading={employeesLoading}
                          value={selectedEmployees}
                          onChange={setSelectedEmployees}
                          showSearch
                          filterOption={(input, option: any) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                          style={{ width: '100%' }}
                        >
                          {employees.map((emp) => (
                            <Select.Option key={emp.id} value={emp.id}>
                              {emp.full_name || `${emp.first_name} ${emp.last_name}`} ({emp.employee_number}) - {emp.department}
                            </Select.Option>
                          ))}
                        </Select>
                        <Space style={{ marginTop: 8 }}>
                          <Button
                            type="link"
                            onClick={() => setSelectedEmployees(employees.map(e => e.id))}
                            style={{ padding: 0 }}
                          >
                            Select All Employees
                          </Button>
                          <Button
                            type="primary"
                            onClick={handleOpenCustomPolicies}
                            disabled={selectedEmployees.length === 0}
                            size="small"
                          >
                            Custom Policies
                          </Button>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Leave Policies"
                        required
                        extra={`${selectedPolicies.length} leave type(s) selected`}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Select leave types to allocate"
                          value={selectedPolicies}
                          onChange={setSelectedPolicies}
                          showSearch
                          filterOption={(input, option: any) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                          style={{ width: '100%' }}
                        >
                          {policies.map((policy) => (
                            <Select.Option key={policy.id} value={policy.id}>
                              {policy.display_name} ({policy.annual_entitlement_days} days/year)
                            </Select.Option>
                          ))}
                        </Select>
                        <Button
                          type="link"
                          onClick={() => setSelectedPolicies(policies.map(p => p.id))}
                          style={{ padding: 0, marginTop: 8 }}
                        >
                          Select All Leave Types
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Allocation Preview */}
                  {selectedPolicies.length > 0 && (
                    <Alert
                      type="success"
                      message="Allocation Preview"
                      description={
                        <div>
                          <p style={{ marginBottom: 8 }}>The following leave days will be allocated to each selected employee:</p>
                          <ul style={{ marginBottom: 0 }}>
                            {selectedPolicies.map(policyId => {
                              const policy = policies.find(p => p.id === policyId);
                              return policy ? (
                                <li key={policyId}>
                                  <strong>{policy.display_name}:</strong> {policy.annual_entitlement_days} days
                                </li>
                              ) : null;
                            })}
                          </ul>
                        </div>
                      }
                      showIcon
                      style={{ marginBottom: 24 }}
                    />
                  )}

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Transaction Date"
                        name="transaction_date"
                        tooltip="Leave blank to use today's date"
                      >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Notes"
                        name="notes"
                        rules={[{ required: true, message: 'Please provide notes for audit trail' }]}
                      >
                        <TextArea
                          rows={3}
                          placeholder="Reason for this allocation (e.g., 'Annual leave allocation for 2026')"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<CheckCircleOutlined />}
                        loading={loading}
                        size="large"
                        disabled={selectedEmployees.length === 0 || selectedPolicies.length === 0}
                      >
                        Allocate {selectedPolicies.length} Leave Type(s) to {selectedEmployees.length} Employee(s)
                      </Button>
                      <Button
                        onClick={() => {
                          form.resetFields();
                          setSelectedEmployees([]);
                          setSelectedPolicies([]);
                        }}
                      >
                        Clear
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>

                {/* Custom Policies Modal */}
                <Modal
                  title={`Custom Leave Allocation for ${selectedEmployees.length} Employee(s)`}
                  open={customPoliciesModalVisible}
                  onCancel={() => {
                    setCustomPoliciesModalVisible(false);
                    setCustomPolicyDays({});
                    setSelectedCustomPolicies([]);
                  }}
                  width={800}
                  footer={null}
                >
                  {/* Show selected employees */}
                  {selectedEmployees.length > 0 && (
                    <Alert
                      type="info"
                      message="Selected Employees"
                      description={
                        <div>
                          {selectedEmployees.slice(0, 5).map(empId => {
                            const emp = employees.find(e => e.id === empId);
                            return emp ? (
                              <div key={empId}>
                                {emp.full_name || `${emp.first_name} ${emp.last_name}`} ({emp.employee_number})
                              </div>
                            ) : null;
                          })}
                          {selectedEmployees.length > 5 && (
                            <div style={{ marginTop: 8 }}>
                              <Text type="secondary">... and {selectedEmployees.length - 5} more</Text>
                            </div>
                          )}
                        </div>
                      }
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Form layout="vertical" onFinish={handleCustomAllocation}>
                    {/* Leave Policies Table */}
                    <Form.Item label="Select Leave Policies and Customize Days">
                      <Table
                        dataSource={policies}
                        rowKey="id"
                        pagination={false}
                        scroll={{ y: 300 }}
                        rowSelection={{
                          type: 'checkbox',
                          selectedRowKeys: selectedCustomPolicies,
                          onChange: (selectedKeys) => {
                            setSelectedCustomPolicies(selectedKeys as string[]);
                          },
                        }}
                        columns={[
                          {
                            title: 'Leave Policy',
                            dataIndex: 'display_name',
                            key: 'display_name',
                            width: '40%',
                          },
                          {
                            title: 'Default Days',
                            dataIndex: 'annual_entitlement_days',
                            key: 'annual_entitlement_days',
                            width: '20%',
                            render: (days) => `${days} days`,
                          },
                          {
                            title: 'Custom Days',
                            key: 'custom_days',
                            width: '40%',
                            render: (_, record) => (
                              <InputNumber
                                min={0}
                                max={365}
                                value={customPolicyDays[record.id] || record.annual_entitlement_days}
                                onChange={(value) => {
                                  setCustomPolicyDays({
                                    ...customPolicyDays,
                                    [record.id]: value || 0,
                                  });
                                }}
                                style={{ width: '100%' }}
                                disabled={!selectedCustomPolicies.includes(record.id)}
                              />
                            ),
                          },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Notes"
                      name="notes"
                      rules={[{ required: true, message: 'Please provide notes for audit trail' }]}
                    >
                      <TextArea
                        rows={3}
                        placeholder="Reason for this custom allocation (e.g., 'Pro-rated leave for new joiner', 'Mid-year adjustment')"
                      />
                    </Form.Item>

                    <Alert
                      type="info"
                      message="Transaction date will be automatically set to today"
                      style={{ marginBottom: 16 }}
                    />

                    <Form.Item>
                      <Space>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<CheckCircleOutlined />}
                          loading={loading}
                          disabled={selectedCustomPolicies.length === 0}
                        >
                          Apply Custom Allocation
                        </Button>
                        <Button
                          onClick={() => {
                            setCustomPoliciesModalVisible(false);
                            setCustomPolicyDays({});
                            setSelectedCustomPolicies([]);
                          }}
                        >
                          Cancel
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Modal>
              </Card>
            ),
          },

          // ======================================================================
          // TAB 3: TRANSACTION HISTORY
          // ======================================================================
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> Transaction History
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="Leave Transaction Ledger"
                  description="Complete audit trail of all leave transactions. Transactions are immutable and cannot be modified once created."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <DataTable
                  columns={transactionColumns}
                  dataSource={transactions}
                  loading={transactionsLoading}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} transactions` }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};
