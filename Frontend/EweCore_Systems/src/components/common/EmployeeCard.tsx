import { Card, Avatar, Typography, Space, Progress } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { CSSProperties } from 'react';

const { Text, Title } = Typography;

interface EmployeeCardProps {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  email?: string;
  phone?: string;
  projects?: number;
  done?: number;
  progress?: number;
  productivity?: number;
  onClick?: () => void;
  style?: CSSProperties;
}

const gradients = [
  'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
  'linear-gradient(135deg, #00BFA5 0%, #26C6B8 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
  'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
];

export const EmployeeCard = ({
  id,
  name,
  role,
  department,
  avatar,
  email,
  phone,
  projects,
  done,
  progress,
  productivity,
  onClick,
  style,
}: EmployeeCardProps) => {
  // Use employee ID to consistently select a gradient
  const gradientIndex = parseInt(id.replace(/\D/g, '')) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        ...style,
      }}
      bodyStyle={{ padding: 0 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      {/* Gradient Header with Avatar */}
      <div
        style={{
          background: gradient,
          height: '120px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '40px',
          position: 'relative',
        }}
      >
        <Avatar
          size={80}
          src={avatar}
          icon={<UserOutlined />}
          style={{
            border: '4px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            background: 'white',
            color: '#32373c',
          }}
        >
          {!avatar && name.split(' ').map(n => n[0]).join('')}
        </Avatar>
      </div>

      {/* Employee Info */}
      <div style={{ padding: '40px 20px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Title
            level={5}
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: '#32373c',
            }}
          >
            {name}
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: '13px', display: 'block', marginTop: '4px' }}>
            {role}
          </Text>
          <Text style={{ color: '#00d084', fontSize: '12px', fontWeight: 500 }}>
            {department}
          </Text>
        </div>

        {/* Contact Info (Optional) */}
        {(email || phone) && (
          <div style={{ marginBottom: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MailOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                  <Text style={{ fontSize: '12px', color: '#595959' }} ellipsis>
                    {email}
                  </Text>
                </div>
              )}
              {phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                  <Text style={{ fontSize: '12px', color: '#595959' }}>{phone}</Text>
                </div>
              )}
            </Space>
          </div>
        )}

        {/* Project Stats (Optional) */}
        {(projects !== undefined || done !== undefined || progress !== undefined) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: '16px',
              background: '#f5f5f5',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            {projects !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: '#32373c', display: 'block' }}>
                  {projects}
                </Text>
                <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>Projects</Text>
              </div>
            )}
            {done !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: '#00d084', display: 'block' }}>
                  {done}
                </Text>
                <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>Done</Text>
              </div>
            )}
            {progress !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: '#ff6900', display: 'block' }}>
                  {progress}
                </Text>
                <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>Progress</Text>
              </div>
            )}
          </div>
        )}

        {/* Productivity Bar (Optional) */}
        {productivity !== undefined && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <Text style={{ fontSize: '12px', fontWeight: 500, color: '#32373c' }}>
                Productivity
              </Text>
              <Text style={{ fontSize: '12px', fontWeight: 600, color: '#00d084' }}>
                {productivity}%
              </Text>
            </div>
            <Progress
              percent={productivity}
              strokeColor={{
                '0%': '#00d084',
                '100%': '#00BFA5',
              }}
              trailColor="#f0f0f0"
              showInfo={false}
              strokeWidth={8}
              style={{ marginBottom: 0 }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
