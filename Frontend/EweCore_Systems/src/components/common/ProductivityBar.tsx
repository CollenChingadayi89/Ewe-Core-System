import { Progress, Typography } from 'antd';
import { CSSProperties } from 'react';

const { Text } = Typography;

interface ProductivityBarProps {
  percentage: number;
  label?: string;
  showPercentage?: boolean;
  height?: number;
  color?: string | { from: string; to: string };
  style?: CSSProperties;
}

export const ProductivityBar = ({
  percentage,
  label = 'Productivity',
  showPercentage = true,
  height = 8,
  color,
  style,
}: ProductivityBarProps) => {
  // Determine color based on percentage if not provided
  const getDefaultColor = () => {
    if (percentage >= 80) return { from: '#00d084', to: '#00BFA5' };
    if (percentage >= 60) return { from: '#0693e3', to: '#3B82F6' };
    if (percentage >= 40) return { from: '#ff6900', to: '#F59E0B' };
    return { from: '#cf2e2e', to: '#EF4444' };
  };

  const gradientColor = color
    ? typeof color === 'string'
      ? { from: color, to: color }
      : color
    : getDefaultColor();

  return (
    <div style={style}>
      {(label || showPercentage) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          {label && (
            <Text style={{ fontSize: '12px', fontWeight: 500, color: '#32373c' }}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: typeof gradientColor === 'string' ? gradientColor : gradientColor.from,
              }}
            >
              {percentage}%
            </Text>
          )}
        </div>
      )}
      <Progress
        percent={percentage}
        strokeColor={
          typeof gradientColor === 'string'
            ? gradientColor
            : {
                '0%': gradientColor.from,
                '100%': gradientColor.to,
              }
        }
        trailColor="#f0f0f0"
        showInfo={false}
        strokeWidth={height}
        style={{ marginBottom: 0 }}
      />
    </div>
  );
};
