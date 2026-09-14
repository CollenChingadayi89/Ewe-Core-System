import { useState, useEffect } from 'react';
import { Calendar, Card, Typography, Space, Tag, Drawer, Descriptions, Row, Col, Select } from 'antd';
import { CalendarOutlined, UserOutlined, PhoneOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useReceivablesStore } from '../../store/receivablesStore';
import { PageHeader, StatusTag } from '../../components/common';
import type { Receivable } from '../../types/index';

const { Title, Text } = Typography;

export const ReceivablesCalendar = () => {
  const { receivables, fetchReceivables } = useReceivablesStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedReceivables, setSelectedReceivables] = useState<Receivable[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  // Filter receivables based on status and category
  const filteredReceivables = receivables.filter(r => {
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    const categoryMatch = filterCategory === 'all' || r.category === filterCategory;
    // Only show approved, scheduled, partially-paid, or overdue receivables on calendar
    const relevantStatus = ['approved', 'scheduled', 'partially-paid', 'paid', 'overdue', 'defaulted'].includes(r.status);
    return statusMatch && categoryMatch && relevantStatus;
  });

  // Get receivables for a specific date
  const getReceivablesForDate = (date: Dayjs): Receivable[] => {
    const dateStr = date.format('DD/MM/YYYY');
    return filteredReceivables.filter(r => r.expectedDate === dateStr);
  };

  // Get list data for calendar cell
  const getListData = (value: Dayjs) => {
    const receivablesForDate = getReceivablesForDate(value);
    return receivablesForDate.map(r => ({
      type: r.status === 'overdue' || r.status === 'defaulted' ? 'error' :
            r.status === 'partially-paid' ? 'warning' :
            r.status === 'paid' ? 'success' : 'processing',
      content: `${r.memberName} - ZWG ${(r.amountOutstanding || r.amount).toLocaleString()}`,
      receivable: r,
    }));
  };

  // Get color for receivable status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
      case 'defaulted':
        return '#ff4d4f'; // Red
      case 'approved':
        return '#52c41a'; // Green
      case 'scheduled':
        return '#1890ff'; // Blue
      case 'partially-paid':
        return '#faad14'; // Orange
      case 'paid':
        return '#722ed1'; // Purple
      default:
        return '#13c2c2'; // Cyan
    }
  };

  // Get color for service category
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'ewe-cub': '#9b51e0',
      'loan-0-percent': '#0693e3',
      'loan-10-percent': '#00d084',
      'mukando': '#fcb900',
      'student-sacco': '#eb144c',
      'share-purchase': '#f78da7',
    };
    return colors[category] || '#8b572a';
  };

  // Calendar cell renderer with colorful badges
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);

    if (listData.length === 0) return null;

    return (
      <div style={{ padding: '2px' }}>
        {listData.slice(0, 3).map((item, index) => (
          <div
            key={index}
            style={{
              marginBottom: '4px',
              padding: '4px 6px',
              borderRadius: '4px',
              background: `${getCategoryColor(item.receivable.category)}15`,
              borderLeft: `3px solid ${getStatusColor(item.receivable.status)}`,
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${getCategoryColor(item.receivable.category)}25`;
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${getCategoryColor(item.receivable.category)}15`;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <Text
              strong
              style={{
                fontSize: '11px',
                color: getStatusColor(item.receivable.status),
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.receivable.memberName}
            </Text>
            <Text
              style={{
                fontSize: '10px',
                color: '#666',
                display: 'block',
              }}
            >
              ZWG {(item.receivable.amountOutstanding || item.receivable.amount).toLocaleString()}
            </Text>
          </div>
        ))}
        {listData.length > 3 && (
          <div
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
              fontSize: '10px',
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            +{listData.length - 3} more
          </div>
        )}
      </div>
    );
  };

  // Handle date selection
  const onSelect = (value: Dayjs) => {
    const receivablesForDate = getReceivablesForDate(value);
    if (receivablesForDate.length > 0) {
      setSelectedDate(value);
      setSelectedReceivables(receivablesForDate);
      setDrawerVisible(true);
    }
  };

  // Calculate statistics
  const stats = {
    totalAmount: filteredReceivables.reduce((sum, r) => sum + (r.amountOutstanding || r.amount), 0),
    totalReceivables: filteredReceivables.length,
    thisMonth: filteredReceivables.filter(r => {
      const expectedDate = dayjs(r.expectedDate, 'DD/MM/YYYY');
      return expectedDate.month() === dayjs().month() && expectedDate.year() === dayjs().year();
    }).length,
    upcoming: filteredReceivables.filter(r => {
      const expectedDate = dayjs(r.expectedDate, 'DD/MM/YYYY');
      return expectedDate.isAfter(dayjs());
    }).length,
  };

  return (
    <div>
      <PageHeader
        title="Receivables Calendar"
        subtitle="Visual calendar of expected payment collection dates"
        breadcrumbs={[
          { title: 'Finance' },
          { title: 'Receivables' },
          { title: 'Calendar' },
        ]}
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Total Expected</Text>
              <Title level={3} style={{ margin: 0, color: '#00d084' }}>
                ZWG {stats.totalAmount.toLocaleString()}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Total Receivables</Text>
              <Title level={3} style={{ margin: 0 }}>
                {stats.totalReceivables}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">This Month</Text>
              <Title level={3} style={{ margin: 0 }}>
                {stats.thisMonth}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 208, 132, 0.3)',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Upcoming</Text>
              <Title level={3} style={{ margin: 0, color: '#fff' }}>
                {stats.upcoming}
              </Title>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Space size="large" wrap>
          <Space>
            <Text strong>Filter by Status:</Text>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 180 }}
            >
              <Select.Option value="all">All Statuses</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="scheduled">Scheduled</Select.Option>
              <Select.Option value="partially-paid">Partially Paid</Select.Option>
              <Select.Option value="paid">Paid</Select.Option>
              <Select.Option value="overdue">Overdue</Select.Option>
              <Select.Option value="defaulted">Defaulted</Select.Option>
            </Select>
          </Space>

          <Space>
            <Text strong>Filter by Service:</Text>
            <Select
              value={filterCategory}
              onChange={setFilterCategory}
              style={{ width: 180 }}
            >
              <Select.Option value="all">All Services</Select.Option>
              <Select.Option value="ewe-cub">Ewe Cub</Select.Option>
              <Select.Option value="loan-0-percent">0% Loan</Select.Option>
              <Select.Option value="loan-10-percent">10% Loan</Select.Option>
              <Select.Option value="mukando">Mukando</Select.Option>
              <Select.Option value="student-sacco">Student SACCO</Select.Option>
              <Select.Option value="share-purchase">Share Purchase</Select.Option>
            </Select>
          </Space>
        </Space>
      </Card>

      {/* Legend */}
      <Card
        style={{
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: 'none',
          borderRadius: '12px',
        }}
      >
        <Space size="large" wrap>
          <Space>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ff4d4f',
              boxShadow: '0 2px 8px rgba(255, 77, 79, 0.4)',
            }} />
            <Text strong style={{ color: '#ff4d4f' }}>Overdue/Defaulted</Text>
          </Space>
          <Space>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#52c41a',
              boxShadow: '0 2px 8px rgba(82, 196, 26, 0.4)',
            }} />
            <Text strong style={{ color: '#52c41a' }}>Approved</Text>
          </Space>
          <Space>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#1890ff',
              boxShadow: '0 2px 8px rgba(24, 144, 255, 0.4)',
            }} />
            <Text strong style={{ color: '#1890ff' }}>Scheduled</Text>
          </Space>
          <Space>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#faad14',
              boxShadow: '0 2px 8px rgba(250, 173, 20, 0.4)',
            }} />
            <Text strong style={{ color: '#faad14' }}>Partially Paid</Text>
          </Space>
          <Space>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#722ed1',
              boxShadow: '0 2px 8px rgba(114, 46, 209, 0.4)',
            }} />
            <Text strong style={{ color: '#722ed1' }}>Paid</Text>
          </Space>
        </Space>
      </Card>

      {/* Calendar */}
      <Card
        style={{
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={onSelect}
          style={{
            background: 'transparent',
          }}
        />
      </Card>

      {/* Details Drawer */}
      <Drawer
        title={
          <Space>
            <MoneyCollectOutlined />
            <span>Receivables on {selectedDate.format('DD MMMM YYYY')}</span>
          </Space>
        }
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedReceivables.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card
              style={{
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 208, 132, 0.3)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Total Expected for This Day</Text>
                <Title level={3} style={{ margin: 0, color: '#fff' }}>
                  ZWG {selectedReceivables.reduce((sum, r) => sum + (r.amountOutstanding || r.amount), 0).toLocaleString()}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{selectedReceivables.length} receivable(s)</Text>
              </Space>
            </Card>

            {selectedReceivables.map((receivable) => (
              <Card
                key={receivable.id}
                style={{
                  borderLeft: `4px solid ${getStatusColor(receivable.status)}`,
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong style={{ fontSize: '16px' }}>{receivable.memberName}</Text>
                    <StatusTag status={receivable.status} />
                  </Space>

                  <Space>
                    <Tag color={getCategoryColor(receivable.category).replace('#', '')}>
                      {receivable.categoryDisplay}
                    </Tag>
                  </Space>

                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Receivable ID">
                      <Text strong>{receivable.id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Member Number">
                      {receivable.memberNumber || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Reference">
                      {receivable.referenceNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount">
                      <Text strong style={{ color: '#00d084', fontSize: '16px' }}>
                        ZWG {receivable.amount.toLocaleString()}
                      </Text>
                    </Descriptions.Item>
                    {receivable.amountPaid !== undefined && receivable.amountPaid > 0 && (
                      <>
                        <Descriptions.Item label="Amount Paid">
                          <Text style={{ color: '#52c41a' }}>
                            ZWG {receivable.amountPaid.toLocaleString()}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Outstanding">
                          <Text strong style={{ color: '#ff6900', fontSize: '16px' }}>
                            ZWG {(receivable.amountOutstanding || 0).toLocaleString()}
                          </Text>
                        </Descriptions.Item>
                      </>
                    )}
                    <Descriptions.Item label="Department">
                      {receivable.department}
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={receivable.priority === 'high' ? 'red' : receivable.priority === 'medium' ? 'orange' : 'blue'}>
                        {receivable.priority.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    {receivable.loanAccountNumber && (
                      <Descriptions.Item label="Loan Account">
                        {receivable.loanAccountNumber}
                      </Descriptions.Item>
                    )}
                    {receivable.installmentNumber && receivable.totalInstallments && (
                      <Descriptions.Item label="Installment">
                        {receivable.installmentNumber} of {receivable.totalInstallments}
                      </Descriptions.Item>
                    )}
                    {receivable.phone && (
                      <Descriptions.Item label="Phone">
                        <Space>
                          <PhoneOutlined />
                          {receivable.phone}
                        </Space>
                      </Descriptions.Item>
                    )}
                    {receivable.paymentMethod && (
                      <Descriptions.Item label="Payment Method">
                        {receivable.paymentMethod}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Description">
                      {receivable.description}
                    </Descriptions.Item>
                  </Descriptions>
                </Space>
              </Card>
            ))}
          </Space>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Text type="secondary">No receivables expected for this date</Text>
          </div>
        )}
      </Drawer>
    </div>
  );
};
