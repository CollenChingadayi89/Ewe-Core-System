import { Breadcrumb, Typography, Button, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { ReactNode, CSSProperties } from 'react';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

interface BreadcrumbItem {
  title: string;
  path?: string;
  icon?: ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  style?: CSSProperties;
}

export const PageHeader = ({ title, subtitle, breadcrumbs, actions, style }: PageHeaderProps) => {
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Home',
      path: '/dashboard',
      icon: <HomeOutlined />,
    },
  ];

  const finalBreadcrumbs = breadcrumbs
    ? [...defaultBreadcrumbs, ...breadcrumbs]
    : defaultBreadcrumbs;

  return (
    <div
      style={{
        marginBottom: '24px',
        background: 'white',
        padding: '20px 24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {/* Breadcrumb */}
      <Breadcrumb
        style={{ marginBottom: '12px' }}
        items={finalBreadcrumbs.map((item) => ({
          title: item.path ? (
            <Link to={item.path} style={{ color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {item.icon}
              <span>{item.title}</span>
            </Link>
          ) : (
            <span style={{ color: '#32373c', fontWeight: 500 }}>
              {item.icon && <span style={{ marginRight: '6px' }}>{item.icon}</span>}
              {item.title}
            </span>
          ),
        }))}
      />

      {/* Title and Actions Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        {/* Title Section */}
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 600,
              color: '#32373c',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Title>
          {subtitle && (
            <Text
              style={{
                color: '#8c8c8c',
                fontSize: '14px',
                marginTop: '6px',
                display: 'block',
              }}
            >
              {subtitle}
            </Text>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <Space size="middle" style={{ flexShrink: 0 }}>
            {actions}
          </Space>
        )}
      </div>
    </div>
  );
};
