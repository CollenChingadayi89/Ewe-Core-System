import { Tag } from 'antd';
import { CSSProperties } from 'react';

interface StatusTagProps {
  status: string;
  style?: CSSProperties;
}

const statusConfig: Record<string, { color: string; background: string; borderColor: string }> = {
  // Approval statuses
  pending: {
    color: '#ff6900',
    background: 'linear-gradient(135deg, #fff4e6 0%, #ffe7ba 100%)',
    borderColor: '#ff6900',
  },
  approved: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
  rejected: {
    color: '#cf2e2e',
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    borderColor: '#cf2e2e',
  },
  cancelled: {
    color: '#8c8c8c',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    borderColor: '#d9d9d9',
  },

  // Attendance statuses
  present: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
  absent: {
    color: '#cf2e2e',
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    borderColor: '#cf2e2e',
  },
  late: {
    color: '#ff6900',
    background: 'linear-gradient(135deg, #fff4e6 0%, #ffe7ba 100%)',
    borderColor: '#ff6900',
  },
  permission: {
    color: '#0693e3',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderColor: '#0693e3',
  },

  // Leave statuses
  annual: {
    color: '#0693e3',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderColor: '#0693e3',
  },
  sick: {
    color: '#cf2e2e',
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    borderColor: '#cf2e2e',
  },
  casual: {
    color: '#9b51e0',
    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    borderColor: '#9b51e0',
  },
  maternity: {
    color: '#EC4899',
    background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    borderColor: '#EC4899',
  },

  // Petty cash statuses
  disbursed: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
  reconciled: {
    color: '#0693e3',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderColor: '#0693e3',
  },

  // Employee statuses
  permanent: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
  contract: {
    color: '#0693e3',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderColor: '#0693e3',
  },
  probation: {
    color: '#ff6900',
    background: 'linear-gradient(135deg, #fff4e6 0%, #ffe7ba 100%)',
    borderColor: '#ff6900',
  },
  intern: {
    color: '#9b51e0',
    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    borderColor: '#9b51e0',
  },

  // Clock statuses
  in: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
  out: {
    color: '#8c8c8c',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    borderColor: '#d9d9d9',
  },

  // Invoice/Payment statuses
  paid: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
  sent: {
    color: '#9b51e0',
    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    borderColor: '#9b51e0',
  },
  partiallypaid: {
    color: '#ff6900',
    background: 'linear-gradient(135deg, #fff4e6 0%, #ffe7ba 100%)',
    borderColor: '#ff6900',
  },
  'partially-paid': {
    color: '#ff6900',
    background: 'linear-gradient(135deg, #fff4e6 0%, #ffe7ba 100%)',
    borderColor: '#ff6900',
  },
  overdue: {
    color: '#cf2e2e',
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    borderColor: '#cf2e2e',
  },
  defaulted: {
    color: '#8B0000',
    background: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
    borderColor: '#8B0000',
  },
  'written-off': {
    color: '#6b7280',
    background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
    borderColor: '#6b7280',
  },
  disputed: {
    color: '#dc2626',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
    borderColor: '#dc2626',
  },
  scheduled: {
    color: '#0693e3',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderColor: '#0693e3',
  },
  draft: {
    color: '#8c8c8c',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    borderColor: '#d9d9d9',
  },

  // Asset statuses
  active: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
  inactive: {
    color: '#cf2e2e',
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    borderColor: '#cf2e2e',
  },
  undermaintenance: {
    color: '#ff6900',
    background: 'linear-gradient(135deg, #fff4e6 0%, #ffe7ba 100%)',
    borderColor: '#ff6900',
  },
  disposed: {
    color: '#8c8c8c',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    borderColor: '#d9d9d9',
  },

  // Default
  default: {
    color: '#32373c',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    borderColor: '#d9d9d9',
  },
};

export const StatusTag = ({ status, style }: StatusTagProps) => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');
  const config = statusConfig[normalizedStatus] || statusConfig.default;

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
        textTransform: 'capitalize',
        ...style,
      }}
    >
      {status}
    </Tag>
  );
};
