import { Card, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { CSSProperties } from 'react';

const { Text } = Typography;

export interface TimelineSegment {
  label: string;
  duration: string;
  color: string;
  percentage: number;
}

interface AttendanceTimelineProps {
  segments: TimelineSegment[];
  totalHours?: string;
  style?: CSSProperties;
}

export const AttendanceTimeline = ({ segments, totalHours, style }: AttendanceTimelineProps) => {
  return (
    <div style={style}>
      {/* Timeline Bar */}
      <div
        style={{
          display: 'flex',
          height: '40px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '16px',
        }}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            style={{
              flex: segment.percentage,
              background: segment.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            title={`${segment.label}: ${segment.duration}`}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            {segment.percentage > 15 && (
              <Text
                style={{
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600,
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                {segment.duration}
              </Text>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
        }}
      >
        {segments.map((segment, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: segment.color,
              }}
            />
            <div>
              <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block' }}>
                {segment.label}
              </Text>
              <Text style={{ fontSize: '13px', fontWeight: 600, color: '#32373c' }}>
                {segment.duration}
              </Text>
            </div>
          </div>
        ))}

        {totalHours && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '8px',
            }}
          >
            <ClockCircleOutlined style={{ fontSize: '16px', color: '#0693e3' }} />
            <div>
              <Text style={{ fontSize: '11px', color: '#8c8c8c', display: 'block' }}>
                Total Hours
              </Text>
              <Text style={{ fontSize: '14px', fontWeight: 600, color: '#0693e3' }}>
                {totalHours}
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
