import { useState } from 'react';
import { Row, Col, Card, Button, Typography, Table, Tag, Space, Select, DatePicker, message, Modal, Form, Input } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, StatCard } from '../../components/common';
import { mockEmployees } from '../../mock/employees';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  status: 'Present' | 'Absent' | 'Permission' | 'Half Day';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [form] = Form.useForm();

  // Mock attendance records for today
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    mockEmployees.map((emp) => ({
      id: `ATT-${emp.id}-${selectedDate.format('YYYYMMDD')}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: selectedDate.format('DD/MM/YYYY'),
      status: Math.random() > 0.2 ? 'Present' : Math.random() > 0.5 ? 'Absent' : 'Permission',
      checkIn: Math.random() > 0.2 ? `0${Math.floor(Math.random() * 2) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM` : undefined,
      checkOut: Math.random() > 0.2 ? `0${Math.floor(Math.random() * 2) + 5}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} PM` : undefined,
    }))
  );

  // Calculate statistics
  const totalEmployees = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'Absent').length;
  const permissionCount = attendanceRecords.filter((r) => r.status === 'Permission').length;
  const attendanceRate = ((presentCount / totalEmployees) * 100).toFixed(1);

  // Filter records
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesStatus = !statusFilter || record.status === statusFilter;
    return matchesStatus;
  });

  // Handle status change
  const handleStatusChange = (employeeId: string, newStatus: 'Present' | 'Absent' | 'Permission' | 'Half Day') => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.employeeId === employeeId
          ? {
              ...record,
              status: newStatus,
              checkIn: newStatus === 'Present' && !record.checkIn ? '08:30 AM' : record.checkIn,
              checkOut: newStatus === 'Present' && !record.checkOut ? '05:30 PM' : record.checkOut,
            }
          : record
      )
    );
    message.success(`Attendance marked as ${newStatus} for employee`);
  };

  // Handle manual time entry
  const handleManualTimeEntry = (employee: any) => {
    setSelectedEmployee(employee);
    const record = attendanceRecords.find((r) => r.employeeId === employee.id);
    if (record) {
      form.setFieldsValue({
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        notes: record.notes,
      });
    }
    setModalVisible(true);
  };

  // Save manual time entry
  const handleSaveTimeEntry = (values: any) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.employeeId === selectedEmployee.id
          ? {
              ...record,
              checkIn: values.checkIn,
              checkOut: values.checkOut,
              notes: values.notes,
              status: 'Present',
            }
          : record
      )
    );
    message.success('Time entry updated successfully');
    setModalVisible(false);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'success';
      case 'Absent':
        return 'error';
      case 'Permission':
        return 'warning';
      case 'Half Day':
        return 'processing';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#32373c' }}>{record.employeeName}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.department}</div>
        </div>
      ),
    },
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 120,
      render: (id: string) => <Text type="secondary">{id}</Text>,
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 120,
      render: (time: string) => (
        <Text style={{ color: time ? '#595959' : '#d9d9d9' }}>
          {time || 'Not checked in'}
        </Text>
      ),
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      width: 120,
      render: (time: string) => (
        <Text style={{ color: time ? '#595959' : '#d9d9d9' }}>
          {time || 'Not checked out'}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={
          status === 'Present' ? <CheckCircleOutlined /> :
          status === 'Absent' ? <CloseCircleOutlined /> :
          <ClockCircleOutlined />
        }>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Mark Attendance',
      key: 'actions',
      width: 300,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type={record.status === 'Present' ? 'primary' : 'default'}
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleStatusChange(record.employeeId, 'Present')}
            style={{
              background: record.status === 'Present' ? '#00d084' : undefined,
              borderColor: record.status === 'Present' ? '#00d084' : undefined,
            }}
          >
            Present
          </Button>
          <Button
            type={record.status === 'Absent' ? 'primary' : 'default'}
            size="small"
            danger={record.status === 'Absent'}
            icon={<CloseCircleOutlined />}
            onClick={() => handleStatusChange(record.employeeId, 'Absent')}
          >
            Absent
          </Button>
          <Button
            type={record.status === 'Permission' ? 'primary' : 'default'}
            size="small"
            icon={<ClockCircleOutlined />}
            onClick={() => handleStatusChange(record.employeeId, 'Permission')}
            style={{
              background: record.status === 'Permission' ? '#fa8c16' : undefined,
              borderColor: record.status === 'Permission' ? '#fa8c16' : undefined,
              color: record.status === 'Permission' ? 'white' : undefined,
            }}
          >
            Permission
          </Button>
          <Button
            size="small"
            onClick={() => handleManualTimeEntry({ id: record.employeeId, name: record.employeeName })}
          >
            Set Time
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance Management"
        subtitle={`Managing attendance for ${selectedDate.format('DD MMMM YYYY')}`}
        breadcrumbs={[{ title: 'Human Resources' }, { title: 'Attendance' }]}
        actions={
          <Space>
            <Button icon={<FileExcelOutlined />} style={{ borderRadius: '8px' }}>
              Import
            </Button>
            <Button icon={<DownloadOutlined />} style={{ borderRadius: '8px' }}>
              Export
            </Button>
          </Space>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={<UserOutlined />}
            iconBg="rgba(103, 58, 183, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Present"
            value={presentCount}
            icon={<CheckCircleOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
            change={2.5}
            trend="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Absent"
            value={absentCount}
            icon={<CloseCircleOutlined />}
            iconBg="rgba(207, 46, 46, 0.1)"
            change={1.2}
            trend="down"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            icon={<CheckCircleOutlined />}
            iconBg="rgba(0, 168, 107, 0.1)"
            change={3.1}
            trend="up"
          />
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '20px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Select Date:</Text>
          </Col>
          <Col>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              format="DD/MM/YYYY"
              style={{ width: 200 }}
            />
          </Col>
          <Col>
            <Text strong>Filter by Status:</Text>
          </Col>
          <Col>
            <Select
              placeholder="All Statuses"
              style={{ width: 180 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Select.Option value="Present">Present</Select.Option>
              <Select.Option value="Absent">Absent</Select.Option>
              <Select.Option value="Permission">Permission</Select.Option>
              <Select.Option value="Half Day">Half Day</Select.Option>
            </Select>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Text type="secondary">
                Showing {filteredRecords.length} of {totalEmployees} employees
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Attendance Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} entries`,
          }}
        />
      </Card>

      {/* Manual Time Entry Modal */}
      <Modal
        title={`Set Time for ${selectedEmployee?.name}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        okText="Save"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTimeEntry}
        >
          <Form.Item
            label="Check In Time"
            name="checkIn"
            rules={[{ required: true, message: 'Please enter check in time' }]}
          >
            <Input placeholder="e.g., 08:30 AM" size="large" />
          </Form.Item>

          <Form.Item
            label="Check Out Time"
            name="checkOut"
          >
            <Input placeholder="e.g., 05:30 PM" size="large" />
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="Add any notes about this attendance entry..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
