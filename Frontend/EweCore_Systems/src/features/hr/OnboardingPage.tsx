import { useState, useEffect } from 'react';
import { Row, Col, Button, Avatar, Progress, Space, Tooltip, Tag, Tabs, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, StatCard, StatusTag, DataTable, FilterBar } from '../../components/common';
import type { Filter } from '../../components/common';
import { useOnboardingStore } from '../../store/onboardingStore';
import { stageConfig } from '../../mock/onboarding';
import dayjs from 'dayjs';

// Legacy types for component compatibility
type OnboardingStage = 'Document Collection' | 'IT Setup' | 'Training' | 'Department Onboarding' | 'Probation' | 'Completed';
type OnboardingStatus = 'Not Started' | 'On Track' | 'Delayed' | 'Completed';

interface OnboardingCandidate {
  id: string;
  candidateId: string;
  name: string;
  position: string;
  department: string;
  stage: OnboardingStage;
  status: OnboardingStatus;
  progress: number;
  startDate: string;
  expectedCompletion: string;
  buddy?: string;
  avatarColor?: string;
}

const { TabPane } = Tabs;
const { TextArea } = Input;

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [stageFilter, setStageFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Zustand store
  const {
    onboardings,
    statistics,
    loading,
    fetchOnboardings,
    fetchStatistics,
    createOnboarding,
  } = useOnboardingStore();

  // Fetch onboarding data on mount
  useEffect(() => {
    fetchOnboardings();
    fetchStatistics();
  }, [fetchOnboardings, fetchStatistics]);

  // Map API data to component format
  const mapApiOnboardingToComponent = (apiData: any): OnboardingCandidate => {
    // Map status from API to component format
    const getComponentStatus = (status: string): OnboardingStatus => {
      if (status === 'completed') return 'Completed';
      if (status === 'in_progress') return 'On Track';
      if (status === 'on_hold') return 'Delayed';
      return 'Not Started';
    };

    // Determine stage based on completion percentage
    const getStage = (percentage: number): OnboardingStage => {
      if (percentage === 100) return 'Completed';
      if (percentage >= 80) return 'Probation';
      if (percentage >= 60) return 'Department Onboarding';
      if (percentage >= 40) return 'Training';
      if (percentage >= 20) return 'IT Setup';
      return 'Document Collection';
    };

    return {
      id: apiData.id,
      candidateId: apiData.onboarding_number,
      name: apiData.employee_name,
      position: apiData.employee_department, // Using department as position placeholder
      department: apiData.employee_department,
      stage: getStage(apiData.completion_percentage),
      status: getComponentStatus(apiData.status),
      progress: apiData.completion_percentage,
      startDate: dayjs(apiData.start_date).format('DD/MM/YYYY'),
      expectedCompletion: dayjs(apiData.expected_completion_date).format('DD/MM/YYYY'),
      buddy: apiData.assigned_buddy_name || undefined,
      avatarColor: undefined,
    };
  };

  const mappedOnboardings = onboardings.map(mapApiOnboardingToComponent);

  // Get statistics with fallbacks
  const stats = {
    totalCandidates: statistics?.total_onboardings || mappedOnboardings.length,
    activeOnboarding: statistics?.in_progress || mappedOnboardings.filter(c => c.status === 'On Track' || c.status === 'Delayed').length,
    completed: statistics?.completed || mappedOnboardings.filter(c => c.status === 'Completed').length,
    averageCompletion: statistics?.average_completion_percentage || 0,
  };

  // Filter candidates based on search and filters
  const filteredCandidates = mappedOnboardings.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.candidateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || candidate.department === departmentFilter;
    const matchesStage = !stageFilter || candidate.stage === stageFilter;
    const matchesStatus = !statusFilter || candidate.status === statusFilter;

    // Tab filtering
    let matchesTab = true;
    if (activeTab === 'in-progress') {
      matchesTab = candidate.status === 'On Track' || candidate.status === 'Delayed';
    } else if (activeTab === 'completed') {
      matchesTab = candidate.status === 'Completed';
    } else if (activeTab === 'pending') {
      matchesTab = candidate.status === 'Not Started';
    }

    return matchesSearch && matchesDepartment && matchesStage && matchesStatus && matchesTab;
  });

  // Filters configuration
  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by name, ID, or position...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 280,
    },
    {
      type: 'select',
      label: 'Department',
      placeholder: 'All Departments',
      onChange: setDepartmentFilter,
      value: departmentFilter,
      width: 200,
      options: [
        { label: 'Finance', value: 'Finance' },
        { label: 'IT', value: 'IT' },
        { label: 'Executive', value: 'Executive' },
        { label: 'Compliance & Risk', value: 'Compliance & Risk' },
        { label: 'Human Resources', value: 'Human Resources' },
        { label: 'Operations', value: 'Operations' },
      ],
    },
    {
      type: 'select',
      label: 'Stage',
      placeholder: 'All Stages',
      onChange: setStageFilter,
      value: stageFilter,
      width: 200,
      options: [
        { label: 'Document Collection', value: 'Document Collection' },
        { label: 'IT Setup', value: 'IT Setup' },
        { label: 'Workspace Setup', value: 'Workspace Setup' },
        { label: 'Orientation', value: 'Orientation' },
        { label: 'Department Induction', value: 'Department Induction' },
        { label: 'Training', value: 'Training' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 160,
      options: [
        { label: 'On Track', value: 'On Track' },
        { label: 'Delayed', value: 'Delayed' },
        { label: 'Not Started', value: 'Not Started' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
    {
      type: 'dateRange',
      label: 'Start Date Range',
      onChange: setDateRange,
      value: dateRange,
      width: 280,
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setDepartmentFilter(undefined);
    setStageFilter(undefined);
    setStatusFilter(undefined);
    setDateRange(undefined);
  };

  // Handle enrollment submission
  const handleEnrollCandidate = async (values: any) => {
    try {
      console.log('New candidate enrollment:', values);
      message.success('Candidate enrolled successfully!');
      setEnrollModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to enroll candidate');
    }
  };

  // Handle view details
  const handleViewDetails = (candidateId: string) => {
    navigate(`/hr/onboarding/${candidateId}`);
  };

  // Get progress bar color based on progress percentage
  const getProgressColor = (progress: number, status: OnboardingStatus) => {
    if (status === 'Completed') return '#00d084';
    if (status === 'Delayed') return '#cf2e2e';
    if (progress >= 75) return '#00d084';
    if (progress >= 50) return '#0693e3';
    if (progress >= 25) return '#ff6900';
    return '#8c8c8c';
  };

  // Render stage tag with custom styling
  const renderStageTag = (stage: OnboardingStage) => {
    const config = stageConfig[stage];
    return (
      <Tag
        style={{
          background: config.background,
          color: config.color,
          border: `1px solid ${config.borderColor}`,
          borderRadius: '6px',
          padding: '4px 12px',
          fontWeight: 500,
          fontSize: '12px',
        }}
      >
        {stage}
      </Tag>
    );
  };

  // Table columns configuration
  const columns: ColumnsType<OnboardingCandidate> = [
    {
      title: 'Candidate ID',
      dataIndex: 'candidateId',
      key: 'candidateId',
      width: 120,
      fixed: 'left',
      render: (id: string) => (
        <span style={{ fontWeight: 600, color: '#0693e3' }}>{id}</span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      fixed: 'left',
      render: (name: string, record: OnboardingCandidate) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={40}
            style={{
              background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            {name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, color: '#32373c' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 180,
      render: (position: string) => (
        <span style={{ color: '#595959', fontWeight: 500 }}>{position}</span>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 160,
      render: (department: string) => (
        <span style={{ color: '#595959' }}>{department}</span>
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
          <span style={{ color: '#595959', fontSize: '13px' }}>{date}</span>
        </div>
      ),
    },
    {
      title: 'Onboarding Stage',
      dataIndex: 'stage',
      key: 'stage',
      width: 180,
      render: (stage: OnboardingStage) => renderStageTag(stage),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 200,
      render: (progress: number, record: OnboardingCandidate) => (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#595959', fontWeight: 500 }}>
              {progress}%
            </span>
            <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
              {record.tasksCompleted}/{record.totalTasks} tasks
            </span>
          </div>
          <Progress
            percent={progress}
            strokeColor={getProgressColor(progress, record.status)}
            showInfo={false}
            strokeWidth={8}
            trailColor="#f0f0f0"
          />
        </div>
      ),
    },
    {
      title: 'Assigned Mentor',
      dataIndex: 'assignedMentor',
      key: 'assignedMentor',
      width: 180,
      render: (mentor: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            size={28}
            style={{
              background: 'linear-gradient(135deg, #9b51e0 0%, #8b3ad5 100%)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {mentor
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </Avatar>
          <span style={{ color: '#595959', fontSize: '13px' }}>{mentor}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: OnboardingStatus) => {
        let config = {
          color: '#00d084',
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          borderColor: '#00d084',
        };

        if (status === 'Delayed') {
          config = {
            color: '#cf2e2e',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            borderColor: '#cf2e2e',
          };
        } else if (status === 'Not Started') {
          config = {
            color: '#8c8c8c',
            background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
            borderColor: '#d9d9d9',
          };
        } else if (status === 'On Track') {
          config = {
            color: '#0693e3',
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            borderColor: '#0693e3',
          };
        }

        return (
          <Tag
            style={{
              background: config.background,
              color: config.color,
              border: `1px solid ${config.borderColor}`,
              borderRadius: '6px',
              padding: '4px 12px',
              fontWeight: 500,
              fontSize: '12px',
            }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: OnboardingCandidate) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.candidateId)}
              style={{
                color: '#0693e3',
                borderRadius: '6px',
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{
                color: '#9b51e0',
                borderRadius: '6px',
              }}
            />
          </Tooltip>
          <Tooltip title="View Documents">
            <Button
              type="text"
              size="small"
              icon={<FileTextOutlined />}
              style={{
                color: '#ff6900',
                borderRadius: '6px',
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Onboarding"
        subtitle={`${filteredCandidates.length} candidate${
          filteredCandidates.length !== 1 ? 's' : ''
        } found`}
        breadcrumbs={[{ title: 'Human Resources' }, { title: 'Onboarding' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEnrollModalVisible(true)}
            style={{
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
              border: 'none',
              fontWeight: 500,
            }}
          >
            Enroll New Candidate
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Total Onboarding"
            value={stats.total}
            icon={<TeamOutlined />}
            cardBg="linear-gradient(135deg, #9b51e0 0%, #8b3ad5 100%)"
            change={16.7}
            trend="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<ClockCircleOutlined />}
            cardBg="linear-gradient(135deg, #0693e3 0%, #0582d1 100%)"
            change={8.3}
            trend="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircleOutlined />}
            cardBg="linear-gradient(135deg, #00d084 0%, #00BFA5 100%)"
            change={12.5}
            trend="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Pending Start"
            value={stats.pendingStart}
            icon={<UserAddOutlined />}
            cardBg="linear-gradient(135deg, #ff6900 0%, #e55f00 100%)"
            change={4.2}
            trend="down"
          />
        </Col>
      </Row>

      {/* Filters */}
      <FilterBar filters={filters} onSearch={setSearchTerm} onReset={handleReset} />

      {/* Stage-based Tabs */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '20px',
          padding: '0 20px',
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: (
                <span style={{ fontWeight: 500 }}>
                  All Candidates ({mappedOnboardings.length})
                </span>
              ),
            },
            {
              key: 'in-progress',
              label: (
                <span style={{ fontWeight: 500 }}>
                  In Progress ({stats.inProgress})
                </span>
              ),
            },
            {
              key: 'completed',
              label: (
                <span style={{ fontWeight: 500 }}>
                  Completed ({stats.completed})
                </span>
              ),
            },
            {
              key: 'pending',
              label: (
                <span style={{ fontWeight: 500 }}>
                  Pending Start ({stats.pendingStart})
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Onboarding Candidates Table */}
      <DataTable
        columns={columns}
        dataSource={filteredCandidates}
        rowKey="id"
        scroll={{ x: 1800 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `Showing ${range[0]} to ${range[1]} of ${total} entries`,
        }}
      />

      {/* Empty state */}
      {filteredCandidates.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            marginTop: '20px',
          }}
        >
          <UserAddOutlined
            style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }}
          />
          <h3 style={{ color: '#32373c', marginBottom: '8px' }}>
            No onboarding candidates found
          </h3>
          <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
            Try adjusting your search or filters
          </p>
          <Button onClick={handleReset}>Clear Filters</Button>
        </div>
      )}

      {/* Stage Progress Indicator */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginTop: '20px',
          padding: '24px',
        }}
      >
        <h3 style={{ marginBottom: '20px', color: '#32373c', fontWeight: 600 }}>
          Onboarding Stages Overview
        </h3>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {Object.entries(stageConfig).map(([stage, config], index) => {
            const count = mappedOnboardings.filter((c) => c.stage === stage).length;
            return (
              <div
                key={stage}
                style={{
                  flex: '1 1 150px',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    background: config.background,
                    border: `2px solid ${config.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '20px',
                    color: config.color,
                  }}
                >
                  {count}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#595959',
                    marginBottom: '4px',
                  }}
                >
                  {stage}
                </div>
                <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                  {count === 1 ? '1 candidate' : `${count} candidates`}
                </div>
                {index < Object.keys(stageConfig).length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '30px',
                      right: '-10px',
                      width: '20px',
                      height: '2px',
                      background: '#e8e8e8',
                      display: index === Object.keys(stageConfig).length - 1 ? 'none' : 'block',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrollment Modal */}
      <Modal
        title="Enroll New Candidate"
        open={enrollModalVisible}
        onCancel={() => {
          setEnrollModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        width={700}
        okText="Enroll Candidate"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEnrollCandidate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Full Name"
                name="fullName"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter candidate's full name" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' },
                ]}
              >
                <Input placeholder="candidate@ewesacco.org" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="+263 700 000 000" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Position"
                name="position"
                rules={[{ required: true, message: 'Please enter position' }]}
              >
                <Input placeholder="Job title" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department" size="large">
                  <Select.Option value="Finance">Finance</Select.Option>
                  <Select.Option value="IT">IT</Select.Option>
                  <Select.Option value="Executive">Executive</Select.Option>
                  <Select.Option value="Compliance & Risk">Compliance & Risk</Select.Option>
                  <Select.Option value="Human Resources">Human Resources</Select.Option>
                  <Select.Option value="Operations">Operations</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Start Date"
                name="startDate"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Assigned Mentor"
                name="mentor"
                rules={[{ required: true, message: 'Please select mentor' }]}
              >
                <Select placeholder="Select mentor" size="large">
                  <Select.Option value="Collen Chingadayi">Collen Chingadayi - HR Manager</Select.Option>
                  <Select.Option value="David Kamau">David Kamau - Finance Manager</Select.Option>
                  <Select.Option value="Michael Otieno">Michael Otieno - IT Manager</Select.Option>
                  <Select.Option value="Margaret Njeri">Margaret Njeri - CEO</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Employment Type"
                name="employmentType"
                rules={[{ required: true, message: 'Please select employment type' }]}
              >
                <Select placeholder="Select employment type" size="large">
                  <Select.Option value="Permanent">Permanent</Select.Option>
                  <Select.Option value="Contract">Contract</Select.Option>
                  <Select.Option value="Probation">Probation</Select.Option>
                  <Select.Option value="Intern">Intern</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Onboarding Notes"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="Add any special notes or requirements for onboarding..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
