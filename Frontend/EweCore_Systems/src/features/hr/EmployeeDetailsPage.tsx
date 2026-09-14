import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Button, Card, Tabs, Avatar, Space, Tag, Divider, Typography, Progress } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  IdcardOutlined,
  SafetyOutlined,
  FileTextOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { StatusTag } from '../../components/common';
import { mockEmployees, getEmployeeById } from '../../mock/employees';

import type { User } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  period: string;
}

interface Experience {
  company: string;
  position: string;
  period: string;
}

interface Project {
  id: string;
  name: string;
  tasks: number;
  completed: number;
  deadline: string;
  lead: string;
  color: string;
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
}

interface EmployeeDetails extends User {
  employeeId: string;
  dateOfJoin: string;
  reportOfficer?: string;
  gender?: string;
  birthday?: string;
  address?: string;
  passportNo?: string;
  passportExpDate?: string;
  nationality?: string;
  religion?: string;
  maritalStatus?: string;
  employmentOfSpouse?: string;
  numberOfChildren?: number;
  emergencyContacts?: EmergencyContact[];
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
  bankInfo?: BankInfo;
  nssf?: string;
  nhif?: string;
  kra?: string;
  skills?: string[];
  certifications?: string[];
  bio?: string;
}

export const EmployeeDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Get employee from mock data
  const baseEmployee = getEmployeeById(id || '');

  if (!baseEmployee) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Title level={3}>Employee not found</Title>
        <Button onClick={() => navigate('/hr/employees')} type="primary">
          Back to Employees
        </Button>
      </div>
    );
  }

  // Extended employee details with additional mock data
  const employee: EmployeeDetails = {
    ...baseEmployee,
    employeeId: baseEmployee.id,
    dateOfJoin: baseEmployee.joinDate,
    reportOfficer: baseEmployee.reportsTo ? mockEmployees.find(e => e.id === baseEmployee.reportsTo)?.name : undefined,
    gender: 'Male',
    birthday: '24th July 2000',
    address: '1861 Bayonne Ave, Manchester, NJ, 08759',
    passportNo: 'QRE74566FGRT',
    passportExpDate: '15 May 2029',
    nationality: 'Kenyan',
    religion: 'Christianity',
    maritalStatus: 'Yes',
    employmentOfSpouse: 'No',
    numberOfChildren: 2,
    bio: 'As an award winning designer, I deliver exceptional quality work and bring value to your brand! With 10 years of experience and 350+ projects completed worldwide with satisfied customers, I developed the 360° brand approach, which helped me to create numerous brands that are relevant, meaningful and loved.',
    emergencyContacts: [
      { name: 'Adrian Peralt', relationship: 'Father', phone: '+1 127 2685 598' },
      { name: 'Karen Wills', relationship: 'Mother', phone: '+1 989 7774 787' },
    ],
    education: [
      { institution: 'Oxford University', degree: 'Computer Science', field: 'Computer Science', period: '2020 - 2022' },
      { institution: 'Cambridge University', degree: 'Computer Network & Systems', field: 'Computer Network & Systems', period: '2016 - 2019' },
      { institution: 'Oxford School', degree: 'Grade X', field: 'Grade X', period: '2012 - 2016' },
    ],
    experience: [
      { company: 'Google', position: 'UI/UX Developer', period: 'Jan 2013 - Present' },
      { company: 'Salesforce', position: 'Web Developer', period: 'Dec 2012 - Jan 2015' },
      { company: 'HubSpot', position: 'Product Designer', period: 'Dec 2011 - Jan 2012' },
    ],
    projects: [
      {
        id: '1',
        name: 'World Health',
        tasks: 1,
        completed: 9,
        deadline: '22 Aug 2025',
        lead: 'Young',
        color: '#0693e3',
      },
      {
        id: '2',
        name: 'Hospital Administration',
        tasks: 8,
        completed: 15,
        deadline: '31 July 2025',
        lead: 'Leona',
        color: '#9b51e0',
      },
      {
        id: '3',
        name: 'Video Calling App',
        tasks: 22,
        completed: 15,
        deadline: '16 Jan 2025',
        lead: 'Mathis',
        color: '#cf2e2e',
      },
    ],
    bankInfo: {
      bankName: 'Swiz International Bank',
      accountNumber: '159843014841',
      ifscCode: 'ICI24504',
      branch: 'Alabama USA',
    },
    nssf: 'NSSF-2024-001',
    nhif: 'NHIF-2024-001',
    kra: 'KRA-A001234567P',
    skills: ['React', 'TypeScript', 'Node.js', 'UI/UX Design', 'Project Management'],
    certifications: ['Certified Scrum Master', 'AWS Solutions Architect', 'PMP'],
  };

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | undefined }) => (
    <Row style={{ marginBottom: '12px' }}>
      <Col span={24}>
        <Space>
          <span style={{ color: '#8c8c8c', fontSize: '14px' }}>{icon}</span>
          <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>{label}</Text>
        </Space>
        <div style={{ marginLeft: '28px', marginTop: '4px' }}>
          <Text strong style={{ fontSize: '14px' }}>{value || 'N/A'}</Text>
        </div>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: '0px' }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: '16px' }}>
        <Button type="text" onClick={() => navigate('/hr/employees')} style={{ padding: '4px 8px' }}>
          ← Employee Details
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Employee Profile Card */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Header with Gradient */}
            <div
              style={{
                background: 'linear-gradient(135deg, #ff6900 0%, #fcb900 100%)',
                height: '120px',
                position: 'relative',
              }}
            />

            {/* Profile Content */}
            <div style={{ padding: '24px', marginTop: '-60px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Avatar
                  size={120}
                  src={employee.avatar}
                  icon={<UserOutlined />}
                  style={{
                    border: '4px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Title level={4} style={{ marginTop: '16px', marginBottom: '4px' }}>
                  {employee.name}
                  <CheckCircleOutlined style={{ color: '#0693e3', marginLeft: '8px', fontSize: '16px' }} />
                </Title>
                <Tag
                  style={{
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    color: '#0693e3',
                    border: '1px solid #0693e3',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontWeight: 500,
                    marginBottom: '8px',
                  }}
                >
                  {employee.position}
                </Tag>
                <div style={{ marginTop: '8px' }}>
                  <Tag
                    style={{
                      background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                      color: '#9b51e0',
                      border: '1px solid #9b51e0',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                    }}
                  >
                    10+ years of Experience
                  </Tag>
                </div>
              </div>

              {/* Basic Info */}
              <div style={{ marginBottom: '24px' }}>
                <InfoRow icon={<IdcardOutlined />} label="Employee ID" value={employee.employeeId} />
                <InfoRow icon={<TeamOutlined />} label="Team" value={employee.department} />
                <InfoRow icon={<CalendarOutlined />} label="Date of Join" value={employee.dateOfJoin} />
                <InfoRow icon={<UserOutlined />} label="Report Officer" value={employee.reportOfficer} />
              </div>

              {/* Action Buttons */}
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button
                  icon={<EditOutlined />}
                  block
                  style={{
                    borderRadius: '8px',
                    height: '44px',
                    background: '#32373c',
                    color: 'white',
                    border: 'none',
                    fontWeight: 500,
                  }}
                >
                  Edit Info
                </Button>
                <Button
                  icon={<MailOutlined />}
                  block
                  style={{
                    borderRadius: '8px',
                    height: '44px',
                    background: 'linear-gradient(135deg, #ff6900 0%, #fcb900 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 500,
                  }}
                >
                  Message
                </Button>
              </Space>

              <Divider />

              {/* Basic Information Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Title level={5} style={{ margin: 0 }}>Basic information</Title>
                  <Button type="text" icon={<EditOutlined />} size="small" />
                </div>
                <InfoRow icon={<PhoneOutlined />} label="Phone" value={employee.phone} />
                <InfoRow icon={<MailOutlined />} label="Email" value={employee.email} />
                <InfoRow icon={<UserOutlined />} label="Gender" value={employee.gender} />
                <InfoRow icon={<CalendarOutlined />} label="Birthday" value={employee.birthday} />
                <InfoRow icon={<EnvironmentOutlined />} label="Address" value={employee.address} />
              </div>

              <Divider />

              {/* Personal Information Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Title level={5} style={{ margin: 0 }}>Personal Information</Title>
                  <Button type="text" icon={<EditOutlined />} size="small" />
                </div>
                <InfoRow icon={<IdcardOutlined />} label="Passport No" value={employee.passportNo} />
                <InfoRow icon={<CalendarOutlined />} label="Passport Exp Date" value={employee.passportExpDate} />
                <InfoRow icon={<EnvironmentOutlined />} label="Nationality" value={employee.nationality} />
                <InfoRow icon={<SafetyOutlined />} label="Religion" value={employee.religion} />
                <InfoRow icon={<TeamOutlined />} label="Marital status" value={employee.maritalStatus} />
                <InfoRow icon={<UserOutlined />} label="Employment of spouse" value={employee.employmentOfSpouse} />
                <InfoRow icon={<TeamOutlined />} label="No. of children" value={employee.numberOfChildren?.toString()} />
              </div>

              <Divider />

              {/* Emergency Contact */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Title level={5} style={{ margin: 0 }}>Emergency Contact Number</Title>
                  <Button type="text" icon={<EditOutlined />} size="small" />
                </div>
                {employee.emergencyContacts?.map((contact, index) => (
                  <div key={index} style={{ marginBottom: '16px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {index === 0 ? 'Primary' : 'Secondary'}
                    </Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text strong>{contact.name}</Text>
                      <Text type="secondary" style={{ marginLeft: '8px' }}>• {contact.relationship}</Text>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <Text style={{ color: '#0693e3' }}>{contact.phone}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        {/* Right Column - Tabs Content */}
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            {/* Bank & Statutory Button */}
            <div style={{ marginBottom: '24px', textAlign: 'right' }}>
              <Button
                icon={<BankOutlined />}
                style={{
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ff6900 0%, #fcb900 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 500,
                }}
              >
                Bank & Statutory
              </Button>
            </div>

            {/* Tabs */}
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              {/* Profile Tab */}
              <TabPane tab="Profile" key="profile">
                <div>
                  {/* About Employee */}
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <Title level={5} style={{ margin: 0 }}>About Employee</Title>
                      <Button type="text" icon={<EditOutlined />} size="small" />
                    </div>
                    <Paragraph style={{ color: '#595959', lineHeight: 1.8 }}>
                      {employee.bio}
                    </Paragraph>
                  </div>

                  {/* Bank Information */}
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <Title level={5} style={{ margin: 0 }}>Bank Information</Title>
                      <Button type="text" icon={<EditOutlined />} size="small" />
                    </div>
                    <Row gutter={[16, 16]}>
                      <Col span={6}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Bank name</Text>
                        <div><Text strong>{employee.bankInfo?.bankName}</Text></div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Bank account no</Text>
                        <div><Text strong>{employee.bankInfo?.accountNumber}</Text></div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>IFSC Code</Text>
                        <div><Text strong>{employee.bankInfo?.ifscCode}</Text></div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Branch</Text>
                        <div><Text strong>{employee.bankInfo?.branch}</Text></div>
                      </Col>
                    </Row>
                  </div>

                  {/* Family Information */}
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <Title level={5} style={{ margin: 0 }}>Family Information</Title>
                      <Button type="text" icon={<EditOutlined />} size="small" />
                    </div>
                    <Row gutter={[16, 16]}>
                      <Col span={6}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Name</Text>
                        <div><Text strong>Hendry Peralt</Text></div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Relationship</Text>
                        <div><Text strong>Brother</Text></div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Date of birth</Text>
                        <div><Text strong>25 May 2014</Text></div>
                      </Col>
                      <Col span={6}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Phone</Text>
                        <div><Text strong>+1 265 6956 961</Text></div>
                      </Col>
                    </Row>
                  </div>

                  <Row gutter={[24, 24]}>
                    {/* Education Details */}
                    <Col xs={24} md={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Title level={5} style={{ margin: 0 }}>Education Details</Title>
                        <Button type="text" icon={<EditOutlined />} size="small" />
                      </div>
                      {employee.education?.map((edu, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom: '16px',
                            paddingBottom: '16px',
                            borderBottom: index < employee.education!.length - 1 ? '1px solid #f0f0f0' : 'none',
                          }}
                        >
                          <Text strong style={{ display: 'block' }}>{edu.institution}</Text>
                          <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>{edu.degree}</Text>
                          <Text type="secondary" style={{ fontSize: '12px', color: '#ff6900' }}>{edu.period}</Text>
                        </div>
                      ))}
                    </Col>

                    {/* Experience */}
                    <Col xs={24} md={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Title level={5} style={{ margin: 0 }}>Experience</Title>
                        <Button type="text" icon={<EditOutlined />} size="small" />
                      </div>
                      {employee.experience?.map((exp, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom: '16px',
                            paddingBottom: '16px',
                            borderBottom: index < employee.experience!.length - 1 ? '1px solid #f0f0f0' : 'none',
                          }}
                        >
                          <Text strong style={{ display: 'block' }}>{exp.company}</Text>
                          <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>
                            <span style={{
                              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                              color: '#0693e3',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                            }}>
                              {exp.position}
                            </span>
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px', color: '#595959' }}>{exp.period}</Text>
                        </div>
                      ))}
                    </Col>
                  </Row>
                </div>
              </TabPane>

              {/* Projects Tab */}
              <TabPane tab="Projects" key="projects">
                <Row gutter={[16, 16]}>
                  {employee.projects?.map((project) => (
                    <Col xs={24} md={8} key={project.id}>
                      <Card
                        style={{
                          borderRadius: '12px',
                          border: '1px solid #f0f0f0',
                        }}
                        bodyStyle={{ padding: '20px' }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: project.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '12px',
                          }}
                        >
                          <FileTextOutlined style={{ fontSize: '24px', color: 'white' }} />
                        </div>
                        <Title level={5} style={{ marginBottom: '8px' }}>{project.name}</Title>
                        <div style={{ marginBottom: '12px' }}>
                          <Text style={{ fontSize: '13px', color: '#595959' }}>
                            {project.tasks} tasks • {project.completed} Completed
                          </Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <Row>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>Deadline</Text>
                            <div><Text strong style={{ fontSize: '13px' }}>{project.deadline}</Text></div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>Project Lead</Text>
                            <div>
                              <Avatar size={20} style={{ marginRight: '4px' }} />
                              <Text strong style={{ fontSize: '13px' }}>{project.lead}</Text>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Button type="link">Assets</Button>
                </div>
              </TabPane>

              {/* Bank & Statutory Tab */}
              <TabPane tab="Bank & Statutory" key="bank">
                <div>
                  <Title level={5} style={{ marginBottom: '16px' }}>Bank Information</Title>
                  <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                    <Col span={6}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>Bank name</Text>
                      <div><Text strong>{employee.bankInfo?.bankName}</Text></div>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>Bank account no</Text>
                      <div><Text strong>{employee.bankInfo?.accountNumber}</Text></div>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>IFSC Code</Text>
                      <div><Text strong>{employee.bankInfo?.ifscCode}</Text></div>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>Branch</Text>
                      <div><Text strong>{employee.bankInfo?.branch}</Text></div>
                    </Col>
                  </Row>

                  <Title level={5} style={{ marginBottom: '16px' }}>Statutory Information</Title>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>NSSF Number</Text>
                      <div><Text strong>{employee.nssf}</Text></div>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>NHIF Number</Text>
                      <div><Text strong>{employee.nhif}</Text></div>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>KRA PIN</Text>
                      <div><Text strong>{employee.kra}</Text></div>
                    </Col>
                  </Row>
                </div>
              </TabPane>

              {/* Assets Tab */}
              <TabPane tab="Assets" key="assets">
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <FileTextOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#8c8c8c' }}>No Assets Assigned</Title>
                  <Text type="secondary">This employee has no assets assigned yet.</Text>
                </div>
              </TabPane>

              {/* Documents Tab */}
              <TabPane tab="Documents" key="documents">
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <FileTextOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#8c8c8c' }}>No Documents</Title>
                  <Text type="secondary">No documents have been uploaded for this employee.</Text>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
