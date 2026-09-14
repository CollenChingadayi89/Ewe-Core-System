import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Timeline, Row, Col, Progress, Typography, Steps, Checkbox, List, Space } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { mockOnboardingCandidates, stageConfig } from '../../mock/onboarding';

const { Title, Text } = Typography;
const { Step } = Steps;

export const OnboardingDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find the candidate by ID
  const candidate = mockOnboardingCandidates.find((c) => c.candidateId === id);

  if (!candidate) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <UserOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Title level={4}>Candidate Not Found</Title>
          <Text type="secondary">The onboarding candidate you're looking for doesn't exist.</Text>
          <br />
          <Button type="primary" onClick={() => navigate('/hr/onboarding')} style={{ marginTop: '16px' }}>
            Back to Onboarding
          </Button>
        </div>
      </Card>
    );
  }

  // Mock checklist data
  const checklistData = [
    { id: 1, task: 'Submit identification documents', completed: true, stage: 'Document Collection' },
    { id: 2, task: 'Complete background verification form', completed: true, stage: 'Document Collection' },
    { id: 3, task: 'Provide banking details', completed: true, stage: 'Document Collection' },
    { id: 4, task: 'Create email account', completed: candidate.progress >= 30, stage: 'IT Setup' },
    { id: 5, task: 'Setup workstation and access credentials', completed: candidate.progress >= 40, stage: 'IT Setup' },
    { id: 6, task: 'Assign desk and workspace', completed: candidate.progress >= 50, stage: 'Workspace Setup' },
    { id: 7, task: 'Provide office equipment', completed: candidate.progress >= 60, stage: 'Workspace Setup' },
    { id: 8, task: 'Company orientation session', completed: candidate.progress >= 70, stage: 'Orientation' },
    { id: 9, task: 'Department induction', completed: candidate.progress >= 80, stage: 'Department Induction' },
    { id: 10, task: 'Job-specific training', completed: candidate.progress >= 90, stage: 'Training' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/hr/onboarding')}
          style={{ marginBottom: '16px' }}
        >
          Back to Onboarding
        </Button>
        <Title level={3} style={{ marginBottom: '8px' }}>
          Onboarding Details
        </Title>
        <Text type="secondary">Candidate ID: {candidate.candidateId}</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Candidate Information */}
        <Col xs={24} lg={16}>
          <Card title="Candidate Information" style={{ marginBottom: '16px' }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Full Name" span={2}>
                <Text strong>{candidate.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {candidate.email}
              </Descriptions.Item>
              <Descriptions.Item label="Position">
                {candidate.position}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {candidate.department}
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                <CalendarOutlined /> {candidate.startDate}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned Mentor">
                <TeamOutlined /> {candidate.assignedMentor}
              </Descriptions.Item>
              <Descriptions.Item label="Current Stage">
                <Tag
                  style={{
                    background: stageConfig[candidate.stage].background,
                    color: stageConfig[candidate.stage].color,
                    border: `1px solid ${stageConfig[candidate.stage].borderColor}`,
                  }}
                >
                  {candidate.stage}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Overall Progress">
                <Progress
                  percent={candidate.progress}
                  status={candidate.status === 'Completed' ? 'success' : 'active'}
                  strokeColor="#00d084"
                />
                <Text type="secondary">
                  {candidate.tasksCompleted} of {candidate.totalTasks} tasks completed
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag
                  color={
                    candidate.status === 'Completed' ? 'success' :
                    candidate.status === 'On Track' ? 'processing' :
                    candidate.status === 'Delayed' ? 'error' : 'default'
                  }
                  icon={
                    candidate.status === 'Completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />
                  }
                >
                  {candidate.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Onboarding Checklist */}
          <Card title="Onboarding Checklist">
            <List
              dataSource={checklistData}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Checkbox checked={item.completed} disabled />
                      <Text
                        style={{
                          textDecoration: item.completed ? 'line-through' : 'none',
                          color: item.completed ? '#8c8c8c' : '#32373c',
                          fontWeight: item.completed ? 'normal' : 500,
                        }}
                      >
                        {item.task}
                      </Text>
                    </Space>
                    <Tag
                      size="small"
                      style={{
                        marginLeft: '24px',
                        fontSize: '11px',
                      }}
                    >
                      {item.stage}
                    </Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Progress Timeline & Actions */}
        <Col xs={24} lg={8}>
          <Card title="Onboarding Progress" style={{ marginBottom: '16px' }}>
            <Steps
              direction="vertical"
              current={Object.keys(stageConfig).indexOf(candidate.stage)}
              items={Object.keys(stageConfig).map((stage) => ({
                title: stage,
                description:
                  Object.keys(stageConfig).indexOf(stage) < Object.keys(stageConfig).indexOf(candidate.stage)
                    ? 'Completed'
                    : Object.keys(stageConfig).indexOf(stage) === Object.keys(stageConfig).indexOf(candidate.stage)
                    ? 'In Progress'
                    : 'Pending',
                icon:
                  Object.keys(stageConfig).indexOf(stage) < Object.keys(stageConfig).indexOf(candidate.stage) ? (
                    <CheckCircleOutlined />
                  ) : (
                    <ClockCircleOutlined />
                  ),
              }))}
            />
          </Card>

          <Card title="Recent Activity">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>Document Collection Complete</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        2 days ago
                      </Text>
                    </div>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>IT Setup Initiated</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        1 day ago
                      </Text>
                    </div>
                  ),
                },
                {
                  color: 'gray',
                  children: (
                    <div>
                      <Text strong>Workspace Setup Pending</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Upcoming
                      </Text>
                    </div>
                  ),
                },
              ]}
            />
          </Card>

          {candidate.status !== 'Completed' && (
            <Card title="Quick Actions" style={{ marginTop: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" block icon={<CheckCircleOutlined />}>
                  Mark Current Stage Complete
                </Button>
                <Button block icon={<FileTextOutlined />}>
                  View Documents
                </Button>
                <Button block icon={<TeamOutlined />}>
                  Contact Mentor
                </Button>
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};
