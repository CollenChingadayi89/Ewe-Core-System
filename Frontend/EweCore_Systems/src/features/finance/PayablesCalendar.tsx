import { useState, useEffect } from 'react';
import { Calendar, Card, Typography, Space, Tag, Drawer, Descriptions, Row, Col, Select } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { usePayablesStore } from '../../store/payablesStore';
import { PageHeader, StatusTag } from '../../components/common';
import type { PayableListResponse } from '../../services/api/payables';
import { formatCurrencyTotals, formatDate, formatMoney } from './payableUtils';

type Payable = PayableListResponse;

/** The date a payable appears on: its scheduled payment date, else its due date (ISO). */
const calendarDate = (p: Payable) => p.collection_date || p.due_date;

const { Title, Text } = Typography;

export const PayablesCalendar = () => {
  const { payables, fetchPayables } = usePayablesStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPayables, setSelectedPayables] = useState<Payable[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  // Only approved (awaiting payment) and paid payables are scheduled on the calendar
  const filteredPayables = payables.filter(p => {
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    return statusMatch && ['approved', 'paid'].includes(p.status);
  });

  // Get payables for a specific date
  const getPayablesForDate = (date: Dayjs): Payable[] => {
    const dateStr = date.format('YYYY-MM-DD');
    return filteredPayables.filter(p => calendarDate(p) === dateStr);
  };

  // Get list data for calendar cell
  const getListData = (value: Dayjs) => {
    const payablesForDate = getPayablesForDate(value);
    return payablesForDate.map(p => ({
      type: p.is_overdue ? 'error' : p.status === 'approved' ? 'warning' : 'success',
      content: `${p.payee_name} - ${formatMoney(p.currency, p.total_amount)}`,
      payable: p,
    }));
  };

  // Get color for payable status
  const getStatusColor = (payable: Payable) => {
    if (payable.is_overdue) return '#ff4d4f'; // Red
    if (payable.status === 'paid') return '#722ed1'; // Purple
    return '#52c41a'; // Green: approved, awaiting payment
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
              background: `${getStatusColor(item.payable)}15`,
              borderLeft: `3px solid ${getStatusColor(item.payable)}`,
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${getStatusColor(item.payable)}25`;
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${getStatusColor(item.payable)}15`;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <Text
              strong
              style={{
                fontSize: '11px',
                color: getStatusColor(item.payable),
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.payable.payee_name}
            </Text>
            <Text
              style={{
                fontSize: '10px',
                color: '#666',
                display: 'block',
              }}
            >
              {formatMoney(item.payable.currency, item.payable.total_amount)}
            </Text>
          </div>
        ))}
        {listData.length > 3 && (
          <div
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    const payablesForDate = getPayablesForDate(value);
    if (payablesForDate.length > 0) {
      setSelectedDate(value);
      setSelectedPayables(payablesForDate);
      setDrawerVisible(true);
    }
  };

  // Calculate statistics
  const stats = {
    totalAmount: formatCurrencyTotals(filteredPayables),
    totalPayables: filteredPayables.length,
    thisMonth: filteredPayables.filter(p => dayjs(calendarDate(p)).isSame(dayjs(), 'month')).length,
    upcoming: filteredPayables.filter(p => dayjs(calendarDate(p)).isAfter(dayjs(), 'day')).length,
  };

  return (
    <div>
      <PageHeader
        title="Payables Calendar"
        subtitle="Visual calendar of scheduled payment collection dates"
        breadcrumbs={[
          { title: 'Finance' },
          { title: 'Payables' },
          { title: 'Calendar' },
        ]}
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          {/* <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          > */}
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Total Scheduled</Text>
              <Title level={3} style={{ margin: 0, color: '#00d084' }}>

                {stats.totalAmount}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          {/* <Card
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)',
            }}
          > */}
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Total Payables</Text>
              <Title level={3} style={{ margin: 0 }}>

                {stats.totalPayables}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          {/* <Card
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
            }}
          > */}
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
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)',
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
        <Space size="large">
          <Space>
            <Text strong>Filter by Status:</Text>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
            >
              <Select.Option value="all">All Statuses</Select.Option>
              <Select.Option value="approved">Awaiting Payment</Select.Option>
              <Select.Option value="paid">Paid</Select.Option>
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
            <Text strong style={{ color: '#ff4d4f' }}>Overdue</Text>
          </Space>
          <Space>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#52c41a',
              boxShadow: '0 2px 8px rgba(82, 196, 26, 0.4)',
            }} />
            <Text strong style={{ color: '#52c41a' }}>Awaiting Payment</Text>
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
            <CalendarOutlined />
            <span>Payables on {selectedDate.format('DD MMMM YYYY')}</span>
          </Space>
        }
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedPayables.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Total Amount for This Day</Text>
                <Title level={3} style={{ margin: 0, color: '#fff' }}>
                  {formatCurrencyTotals(selectedPayables)}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{selectedPayables.length} payable(s)</Text>
              </Space>
            </Card>

            {selectedPayables.map((payable) => (
              <Card
                key={payable.id}
                style={{
                  borderLeft: `4px solid ${
                    payable.is_overdue ? '#cf2e2e' :
                    payable.status === 'paid' ? '#52c41a' :
                    '#ff6900'
                  }`,
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong style={{ fontSize: '16px' }}>{payable.payee_name}</Text>
                    <StatusTag status={payable.status} />
                  </Space>

                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Payable">
                      <Text strong>{payable.payable_number}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payee">
                      {payable.payee_type === 'member' ? 'Member' : 'Vendor'} · {payable.payee_reference}
                    </Descriptions.Item>
                    <Descriptions.Item label="For">
                      {payable.category_display}
                      {payable.invoice_number ? ` (${payable.invoice_number})` : ''}
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount">
                      <Text strong style={{ color: '#00d084', fontSize: '16px' }}>
                        {formatMoney(payable.currency, payable.total_amount)}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Due Date">{formatDate(payable.due_date)}</Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={payable.priority === 'high' ? 'red' : payable.priority === 'medium' ? 'orange' : 'blue'}>
                        {payable.priority.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Method">
                      {payable.payment_method || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Description">
                      {payable.description}
                    </Descriptions.Item>
                  </Descriptions>
                </Space>
              </Card>
            ))}
          </Space>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Text type="secondary">No payables scheduled for this date</Text>
          </div>
        )}
      </Drawer>
    </div>
  );
};
