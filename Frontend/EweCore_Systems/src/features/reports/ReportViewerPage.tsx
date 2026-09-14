import { useState, useEffect } from 'react';
import { Button, Space, Row, Col, Card, Typography, Dropdown, Descriptions, message, Spin, Tabs, DatePicker, Select, Form } from 'antd';
import type { MenuProps } from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageHeader, DataTable, FilterBar } from '../../components/common';
import type { Filter } from '../../components/common';
import { useParams, useNavigate } from 'react-router-dom';
import { useReportStore } from '../../store/reportStore';
import { useAuthStore } from '../../store/authStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel, exportToCSV, exportTableToPDF } from '../../utils/exportHelpers';
import { format } from 'date-fns';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#3B82F6', '#00d084', '#F59E0B', '#8B5CF6', '#10B981', '#6B7280', '#EF4444', '#06B6D4'];

export const ReportViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reports, selectedReport, loading, fetchReport, generateReport } = useReportStore();
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Filter states
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (id) {
      // If ID is a report type (from template), use mock data
      const report = reports.find(r => r.id === id || r.type === id);
      if (report) {
        fetchReport(report.id);
      }
    }
  }, [id]);

  // Use either fetched report or first report as demo
  const report = selectedReport || reports[0];

  if (loading || !report) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading report..." />
      </div>
    );
  }

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    setExporting(true);
    try {
      const fileName = `${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}`;

      switch (format) {
        case 'excel':
          exportToExcel(report.tableData, fileName, 'Report Data');
          message.success('Report exported to Excel successfully!');
          break;
        case 'csv':
          exportToCSV(report.tableData, fileName);
          message.success('Report exported to CSV successfully!');
          break;
        case 'pdf':
          const columns = report.tableData.length > 0 ? Object.keys(report.tableData[0]) : [];
          exportTableToPDF(report.tableData, columns, fileName, report.name);
          message.success('Report exported to PDF successfully!');
          break;
      }
    } catch (error) {
      message.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleApplyFilters = () => {
    message.success('Filters applied! Regenerating report...');
    // In a real app, this would call the API with new filters
  };

  const handleResetFilters = () => {
    setDateRange(null);
    setDepartmentFilter(undefined);
    setStatusFilter(undefined);
    setEmployeeFilter(undefined);
    setCategoryFilter(undefined);
    message.info('Filters reset');
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export to Excel',
      onClick: () => handleExport('excel'),
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Export to PDF',
      onClick: () => handleExport('pdf'),
    },
    {
      key: 'csv',
      icon: <FileTextOutlined />,
      label: 'Export to CSV',
      onClick: () => handleExport('csv'),
    },
  ];

  // Common filters for most reports
  const commonFilters: Filter[] = [
    {
      type: 'select',
      label: 'Department',
      placeholder: 'All Departments',
      onChange: setDepartmentFilter,
      value: departmentFilter,
      width: 200,
      options: [
        { label: 'Human Resources', value: 'HR' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Operations', value: 'Operations' },
        { label: 'IT', value: 'IT' },
        { label: 'Executive', value: 'Executive' },
        { label: 'Compliance', value: 'Compliance' },
      ],
    },
  ];

  // Report-specific filters
  const getReportFilters = (): Filter[] => {
    const filters = [...commonFilters];

    if (report.type === 'attendance' || report.type === 'leave' || report.type === 'expenses') {
      filters.push({
        type: 'select',
        label: 'Status',
        placeholder: 'All Statuses',
        onChange: setStatusFilter,
        value: statusFilter,
        width: 180,
        options: [
          { label: 'Approved', value: 'approved' },
          { label: 'Pending', value: 'pending' },
          { label: 'Rejected', value: 'rejected' },
        ],
      });
    }

    if (report.type === 'expenses') {
      filters.push({
        type: 'select',
        label: 'Category',
        placeholder: 'All Categories',
        onChange: setCategoryFilter,
        value: categoryFilter,
        width: 200,
        options: [
          { label: 'Meals & Entertainment', value: 'meals' },
          { label: 'Transportation', value: 'transport' },
          { label: 'Office Supplies', value: 'supplies' },
          { label: 'Software & Tools', value: 'software' },
          { label: 'Training', value: 'training' },
        ],
      });
    }

    return filters;
  };

  // Prepare table columns dynamically
  const tableColumns: ColumnsType<any> = report.tableData.length > 0
    ? Object.keys(report.tableData[0]).map(key => ({
        title: key.charAt(0).toUpperCase() + key.replace(/([A-Z])/g, ' $1').trim(),
        dataIndex: key,
        key,
        sorter: (a: any, b: any) => {
          if (typeof a[key] === 'number') return a[key] - b[key];
          return String(a[key]).localeCompare(String(b[key]));
        },
        render: (value: any) => {
          if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
            return `KES ${value.toLocaleString()}`;
          }
          return value;
        },
      }))
    : [];

  // Sub-report tabs based on report type
  const getSubReportTabs = () => {
    const baseTabs = [
      {
        key: 'overview',
        label: 'Overview',
        children: null,
      },
    ];

    switch (report.type) {
      case 'employee':
        return [
          ...baseTabs,
          {
            key: 'by-department',
            label: 'By Department',
            children: null,
          },
          {
            key: 'demographics',
            label: 'Demographics',
            children: null,
          },
          {
            key: 'turnover',
            label: 'Turnover Analysis',
            children: null,
          },
        ];
      case 'attendance':
        return [
          ...baseTabs,
          {
            key: 'daily',
            label: 'Daily Breakdown',
            children: null,
          },
          {
            key: 'by-employee',
            label: 'By Employee',
            children: null,
          },
        ];
      case 'leave':
        return [
          ...baseTabs,
          {
            key: 'by-type',
            label: 'By Leave Type',
            children: null,
          },
          {
            key: 'balances',
            label: 'Leave Balances',
            children: null,
          },
        ];
      case 'expenses':
        return [
          ...baseTabs,
          {
            key: 'by-category',
            label: 'By Category',
            children: null,
          },
          {
            key: 'by-department',
            label: 'By Department',
            children: null,
          },
          {
            key: 'top-spenders',
            label: 'Top Spenders',
            children: null,
          },
        ];
      default:
        return baseTabs;
    }
  };

  return (
    <div>
      <PageHeader
        title={report.name}
        subtitle={report.description}
        breadcrumbs={[
          { title: 'Reports' },
          { title: 'View Report' },
        ]}
        actions={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/reports/dashboard')}
            >
              Back to Reports
            </Button>
            <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={exporting}
              >
                Export Report
              </Button>
            </Dropdown>
          </Space>
        }
      />

      {/* Report Metadata */}
      <Card style={{ marginBottom: 24 }}>
        <Descriptions column={4} bordered size="small">
          <Descriptions.Item label="Report Type">
            {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
          </Descriptions.Item>
          <Descriptions.Item label="Generated By">
            {report.generatedByName}
          </Descriptions.Item>
          <Descriptions.Item label="Date Generated">
            {format(new Date(report.generatedAt), 'MMMM dd, yyyy HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Period">
            {report.dateRange.start && report.dateRange.end
              ? `${format(new Date(report.dateRange.start), 'MMM dd, yyyy')} - ${format(new Date(report.dateRange.end), 'MMM dd, yyyy')}`
              : 'Current'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Filters Section */}
      <Card
        title={
          <Space>
            <FilterOutlined />
            <span>Report Filters</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
              Reset
            </Button>
            <Button type="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Date Range</Text>
            </div>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="MMM DD, YYYY"
            />
          </Col>
          {getReportFilters().map((filter, index) => (
            <Col xs={24} md={12} lg={6} key={index}>
              {filter.type === 'select' && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>{filter.label}</Text>
                  </div>
                  <Select
                    style={{ width: '100%' }}
                    placeholder={filter.placeholder}
                    value={filter.value}
                    onChange={filter.onChange}
                    allowClear
                    options={filter.options}
                  />
                </>
              )}
            </Col>
          ))}
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Card title="Summary Statistics" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          {Object.entries(report.summary).map(([key, value]) => (
            <Col xs={24} sm={12} lg={6} key={key}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {key.charAt(0).toUpperCase() + key.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Title level={3} style={{ margin: 0, color: '#00d084' }}>
                  {value}
                </Title>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Sub-Report Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={getSubReportTabs()}
        style={{ marginBottom: 24 }}
      />

      {/* Charts */}
      {report.charts && report.charts.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {report.charts.map((chart, index) => (
            <Col xs={24} lg={12} key={index}>
              <Card title={chart.title} id={`chart-${index}`}>
                <ResponsiveContainer width="100%" height={300}>
                  {chart.type === 'bar' && (
                    <BarChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={chart.xAxisKey} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey={Array.isArray(chart.yAxisKey) ? chart.yAxisKey[0] : chart.yAxisKey}
                        fill={chart.colors?.[0] || '#00d084'}
                      />
                    </BarChart>
                  )}
                  {chart.type === 'line' && (
                    <LineChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={chart.xAxisKey} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={Array.isArray(chart.yAxisKey) ? chart.yAxisKey[0] : chart.yAxisKey}
                        stroke={chart.colors?.[0] || '#3B82F6'}
                        strokeWidth={2}
                      />
                    </LineChart>
                  )}
                  {chart.type === 'pie' && (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey={Array.isArray(chart.yAxisKey) ? chart.yAxisKey[0] : chart.yAxisKey}
                      >
                        {chart.data.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Detailed Data Table */}
      {report.tableData && report.tableData.length > 0 && (
        <Card title={`Detailed Data - ${activeTab === 'overview' ? 'All Records' : activeTab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}>
          <DataTable
            columns={tableColumns}
            dataSource={report.tableData}
            rowKey={(record, index) => `row-${index}`}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} records`,
            }}
          />
        </Card>
      )}
    </div>
  );
};
