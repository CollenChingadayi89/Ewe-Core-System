import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { ReactNode, CSSProperties } from 'react';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  icon?: ReactNode;
  iconBg?: string;
  cardBg?: string;
  prefix?: string;
  suffix?: string;
  style?: CSSProperties;
}

export const StatCard = ({
  title,
  value,
  change,
  trend,
  icon,
  iconBg,
  cardBg,
  prefix,
  suffix,
  style,
}: StatCardProps) => {
  const isColorfulCard = !!cardBg;
  const textColor = isColorfulCard ? 'white' : '#32373c';
  const changeColor = isColorfulCard
    ? 'rgba(255,255,255,0.9)'
    : trend === 'up'
      ? '#00d084'
      : '#cf2e2e';

  return (
    <Card
      style={{
        background: cardBg || 'white',
        border: 'none',
        borderRadius: '12px',
        boxShadow: cardBg
          ? '0 4px 20px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        height: '100%',
        ...style,
      }}
      bodyStyle={{ padding: '20px' }}
      hoverable
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = cardBg
          ? '0 8px 30px rgba(0,0,0,0.2)'
          : '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = cardBg
          ? '0 4px 20px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Text
            style={{
              color: isColorfulCard ? 'rgba(255,255,255,0.85)' : '#8c8c8c',
              fontSize: '14px',
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
            }}
          >
            {title}
          </Text>
          <Statistic
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{
              color: textColor,
              fontSize: '28px',
              fontWeight: 600,
            }}
          />
          {change !== undefined && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {trend === 'up' ? (
                <ArrowUpOutlined style={{ color: changeColor, fontSize: '12px' }} />
              ) : (
                <ArrowDownOutlined style={{ color: changeColor, fontSize: '12px' }} />
              )}
              <Text style={{ color: changeColor, fontSize: '12px', fontWeight: 500 }}>
                {change}% from last month
              </Text>
            </div>
          )}
        </div>
        {icon && (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: iconBg || 'rgba(0,208,132,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: isColorfulCard ? 'white' : '#00d084',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
