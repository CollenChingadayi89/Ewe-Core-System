import { Card, Space, DatePicker, Select, Input, Button } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { ReactNode, CSSProperties } from 'react';

const { RangePicker } = DatePicker;

export interface Filter {
  type: 'search' | 'select' | 'dateRange' | 'custom';
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  onChange?: (value: any) => void;
  value?: any;
  customComponent?: ReactNode;
  width?: number | string;
  label?: string;
}

interface FilterBarProps {
  filters?: Filter[];
  onSearch?: (value: string) => void;
  onReset?: () => void;
  actions?: ReactNode;
  style?: CSSProperties;
}

export const FilterBar = ({ filters = [], onSearch, onReset, actions, style }: FilterBarProps) => {
  return (
    <Card
      style={{
        marginBottom: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...style,
      }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <Space
        size="middle"
        wrap
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Left Side - Filters */}
        <Space size="middle" wrap style={{ flex: 1 }}>
          {filters.map((filter, index) => {
            if (filter.type === 'search') {
              return (
                <Input
                  key={index}
                  placeholder={filter.placeholder || 'Search...'}
                  prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                  onChange={(e) => {
                    filter.onChange?.(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                  value={filter.value}
                  style={{
                    width: filter.width || 250,
                    borderRadius: '8px',
                  }}
                  allowClear
                />
              );
            }

            if (filter.type === 'select') {
              return (
                <div key={index}>
                  {filter.label && (
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
                      {filter.label}
                    </div>
                  )}
                  <Select
                    placeholder={filter.placeholder || 'Select...'}
                    options={filter.options}
                    onChange={filter.onChange}
                    value={filter.value}
                    style={{
                      width: filter.width || 180,
                    }}
                    allowClear
                  />
                </div>
              );
            }

            if (filter.type === 'dateRange') {
              return (
                <div key={index}>
                  {filter.label && (
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
                      {filter.label}
                    </div>
                  )}
                  <RangePicker
                    onChange={filter.onChange}
                    value={filter.value}
                    style={{
                      width: filter.width || 280,
                      borderRadius: '8px',
                    }}
                  />
                </div>
              );
            }

            if (filter.type === 'custom') {
              return <div key={index}>{filter.customComponent}</div>;
            }

            return null;
          })}
        </Space>

        {/* Right Side - Actions */}
        <Space size="small">
          {onReset && (
            <Button
              icon={<ReloadOutlined />}
              onClick={onReset}
              style={{ borderRadius: '8px' }}
            >
              Reset
            </Button>
          )}
          {actions}
        </Space>
      </Space>
    </Card>
  );
};
