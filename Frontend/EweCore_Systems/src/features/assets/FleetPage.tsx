import { useState, useEffect } from 'react';
import { Button, Avatar, Space, Tag, Row, Col, Card, Typography, Progress, Modal, Form, Input, Select, DatePicker, InputNumber, message, Drawer, Descriptions } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  ToolOutlined,
  UserAddOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FireOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import {
  vehicleTypes,
  vehicleStatuses,
  availableDrivers,
} from '../../mock/fleet';
import type { Vehicle, ServiceSchedule } from '../../mock/fleet';
import { useVehicleStore } from '../../store/vehicleStore';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

export const FleetPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [driverFilter, setDriverFilter] = useState<string | undefined>(undefined);
  const [addVehicleModalVisible, setAddVehicleModalVisible] = useState(false);
  const [assignDriverModalVisible, setAssignDriverModalVisible] = useState(false);
  const [scheduleServiceModalVisible, setScheduleServiceModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [serviceForm] = Form.useForm();

  // Get data from store
  const {
    vehicles: apiVehicles,
    loading,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  } = useVehicleStore();

  // Fetch data on mount
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Map API data to component format
  const mapApiVehicleToComponent = (apiData: any): Vehicle => {
    const getDisplayStatus = (status: string): 'Active' | 'In Service' | 'Under Maintenance' | 'Inactive' | 'Accident' => {
      if (status === 'active') return 'Active';
      if (status === 'in_service') return 'In Service';
      if (status === 'under_maintenance') return 'Under Maintenance';
      if (status === 'inactive') return 'Inactive';
      if (status === 'accident') return 'Accident';
      return 'Active';
    };

    return {
      id: apiData.vehicle_number || apiData.id,
      vehicleName: apiData.make + ' ' + apiData.model,
      licensePlate: apiData.license_plate,
      type: apiData.vehicle_type,
      make: apiData.make,
      model: apiData.model,
      year: apiData.year,
      status: getDisplayStatus(apiData.status),
      assignedDriver: apiData.assigned_driver_name || 'Unassigned',
      assignedDriverId: apiData.assigned_driver || 'UNASSIGNED',
      mileage: apiData.current_mileage || 0,
      fuelLevel: apiData.fuel_level || 0,
      lastServiceDate: apiData.last_service_date || '',
      nextServiceDate: apiData.next_service_date || '',
      nextServiceMileage: apiData.next_service_mileage || 0,
      purchaseDate: apiData.purchase_date || '',
      purchaseValue: apiData.purchase_value ? parseFloat(apiData.purchase_value) : 0,
      currentValue: apiData.current_value ? parseFloat(apiData.current_value) : 0,
      insuranceProvider: apiData.insurance_provider,
      insuranceExpiry: apiData.insurance_expiry,
      licenseDiskExpiry: apiData.license_disk_expiry,
      description: apiData.description,
      color: apiData.color,
      vin: apiData.vin,
      engineNumber: apiData.engine_number,
    };
  };

  const mockVehicles = apiVehicles.map(mapApiVehicleToComponent);

  // Mock service schedule - would come from API in production
  const mockServiceSchedule: ServiceSchedule[] = mockVehicles
    .filter(v => v.nextServiceDate && dayjs(v.nextServiceDate).diff(dayjs(), 'days') <= 30)
    .map(v => ({
      id: v.id,
      vehicleName: v.vehicleName,
      licensePlate: v.licensePlate,
      serviceType: 'Regular Maintenance',
      scheduledDate: v.nextServiceDate,
      estimatedCost: 15000,
      status: 'Scheduled',
    }));

  // Calculate fleet stats with fallbacks
  const fleetStats = {
    totalVehicles: mockVehicles.length,
    activeVehicles: mockVehicles.filter(v => v.status === 'Active' || v.status === 'In Service').length,
    underMaintenance: mockVehicles.filter(v => v.status === 'Under Maintenance').length,
    totalMileage: mockVehicles.reduce((sum, v) => sum + v.mileage, 0),
    averageFuelLevel: mockVehicles.length > 0
      ? mockVehicles.reduce((sum, v) => sum + v.fuelLevel, 0) / mockVehicles.length
      : 0,
    fuelCostThisMonth: 0, // Would come from API in production
  };

  // Filter vehicles
  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.assignedDriver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || vehicle.type === typeFilter;
    const matchesStatus = !statusFilter || vehicle.status === statusFilter;
    const matchesDriver = !driverFilter || vehicle.assignedDriverId === driverFilter;

    return matchesSearch && matchesType && matchesStatus && matchesDriver;
  });

  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by vehicle, license plate, or driver...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 340,
    },
    {
      type: 'select',
      label: 'Vehicle Type',
      placeholder: 'All Types',
      onChange: setTypeFilter,
      value: typeFilter,
      width: 160,
      options: vehicleTypes.map((type) => ({ label: type, value: type })),
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 160,
      options: vehicleStatuses.map((status) => ({ label: status, value: status })),
    },
    {
      type: 'select',
      label: 'Assigned Driver',
      placeholder: 'All Drivers',
      onChange: setDriverFilter,
      value: driverFilter,
      width: 200,
      options: [
        { label: 'Unassigned', value: 'UNASSIGNED' },
        ...availableDrivers.map((driver) => ({
          label: `${driver.name} (${driver.experience})`,
          value: driver.id,
        })),
      ],
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setTypeFilter(undefined);
    setStatusFilter(undefined);
    setDriverFilter(undefined);
  };

  const handleAddVehicle = async (values: any) => {
    const vehicleData = {
      make: values.make,
      model: values.model,
      year: values.year,
      license_plate: values.licensePlate,
      vehicle_type: values.type,
      vin: values.vin,
      color: values.color,
      purchase_date: dayjs(values.purchaseDate).format('YYYY-MM-DD'),
      purchase_value: values.purchaseValue,
      status: 'active',
    };

    const result = await createVehicle(vehicleData);
    if (result) {
      setAddVehicleModalVisible(false);
      form.resetFields();
    }
  };

  const handleAssignDriver = async (values: any) => {
    if (!selectedVehicle?.id) return;

    const updateData = {
      assigned_driver: values.driverId,
      assigned_date: dayjs(values.assignDate).format('YYYY-MM-DD'),
    };

    const result = await updateVehicle(selectedVehicle.id, updateData);
    if (result) {
      setAssignDriverModalVisible(false);
      assignForm.resetFields();
      setSelectedVehicle(null);
    }
  };

  const handleScheduleService = async (values: any) => {
    if (!selectedVehicle?.id) return;

    const updateData = {
      next_service_date: dayjs(values.serviceDate).format('YYYY-MM-DD'),
      next_service_mileage: values.serviceMileage,
    };

    const result = await updateVehicle(selectedVehicle.id, updateData);
    if (result) {
      setScheduleServiceModalVisible(false);
      serviceForm.resetFields();
      setSelectedVehicle(null);
    }
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailsDrawerVisible(true);
  };

  const openAssignDriver = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setAssignDriverModalVisible(true);
  };

  const openScheduleService = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setScheduleServiceModalVisible(true);
  };

  // Table columns for fleet
  const columns: ColumnsType<Vehicle> = [
    {
      title: 'Vehicle ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
      render: (id: string) => <span style={{ fontWeight: 600, color: '#32373c' }}>{id}</span>,
    },
    {
      title: 'Vehicle Name',
      dataIndex: 'vehicleName',
      key: 'vehicleName',
      width: 180,
      render: (name: string, record: Vehicle) => (
        <div>
          <div style={{ fontWeight: 500, color: '#32373c' }}>{name}</div>
          <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.model}</Text>
        </div>
      ),
    },
    {
      title: 'License Plate',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 130,
      render: (plate: string) => (
        <Tag
          style={{
            borderRadius: '6px',
            padding: '4px 10px',
            border: '1px solid #0693e3',
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            color: '#0693e3',
            fontWeight: 600,
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          {plate}
        </Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeColors: Record<string, { color: string; bg: string }> = {
          Sedan: { color: '#0693e3', bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' },
          SUV: { color: '#00d084', bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' },
          Van: { color: '#9b51e0', bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' },
          Truck: { color: '#ff6900', bg: 'linear-gradient(135deg, #fff4e6 0%, #ffe7ba 100%)' },
          Pickup: { color: '#cf2e2e', bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' },
        };
        const config = typeColors[type] || typeColors.Sedan;
        return (
          <Tag
            style={{
              borderRadius: '6px',
              padding: '4px 10px',
              border: 'none',
              background: config.bg,
              color: config.color,
              fontWeight: 500,
              fontSize: '12px',
            }}
          >
            {type}
          </Tag>
        );
      },
      filters: vehicleTypes.map((type) => ({ text: type, value: type })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Assigned Driver',
      dataIndex: 'assignedDriver',
      key: 'assignedDriver',
      width: 180,
      render: (name: string, record: Vehicle) => {
        if (name === 'Not Assigned') {
          return (
            <Tag
              style={{
                borderRadius: '6px',
                padding: '4px 12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                color: '#8c8c8c',
                fontWeight: 500,
              }}
            >
              Not Assigned
            </Tag>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              size={32}
              style={{
                background: 'linear-gradient(135deg, #0693e3 0%, #0693e3 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Avatar>
            <span style={{ fontWeight: 500, color: '#32373c', fontSize: '13px' }}>{name}</span>
          </div>
        );
      },
    },
    {
      title: 'Current Mileage',
      dataIndex: 'currentMileage',
      key: 'currentMileage',
      width: 140,
      render: (mileage: number) => (
        <span style={{ color: '#595959', fontWeight: 500 }}>
          {mileage.toLocaleString()} km
        </span>
      ),
      sorter: (a, b) => a.currentMileage - b.currentMileage,
    },
    {
      title: 'Last Service',
      dataIndex: 'lastServiceDate',
      key: 'lastServiceDate',
      width: 120,
      render: (date: string) => (
        <span style={{ color: '#595959', fontSize: '12px' }}>
          {new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.lastServiceDate).getTime() - new Date(b.lastServiceDate).getTime(),
    },
    {
      title: 'Next Service Due',
      dataIndex: 'nextServiceDue',
      key: 'nextServiceDue',
      width: 130,
      render: (date: string) => {
        const dueDate = new Date(date);
        const today = new Date();
        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntilDue < 0;
        const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 7;

        return (
          <div>
            <div
              style={{
                color: isOverdue ? '#cf2e2e' : isUrgent ? '#ff6900' : '#595959',
                fontWeight: isOverdue || isUrgent ? 600 : 400,
                fontSize: '12px',
              }}
            >
              {dueDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            {isOverdue && (
              <Text style={{ fontSize: '11px', color: '#cf2e2e', fontWeight: 500 }}>
                Overdue by {Math.abs(daysUntilDue)} days
              </Text>
            )}
            {isUrgent && !isOverdue && (
              <Text style={{ fontSize: '11px', color: '#ff6900', fontWeight: 500 }}>
                Due in {daysUntilDue} days
              </Text>
            )}
          </div>
        );
      },
      sorter: (a, b) => new Date(a.nextServiceDue).getTime() - new Date(b.nextServiceDue).getTime(),
    },
    {
      title: 'Fuel Consumption',
      dataIndex: 'fuelConsumption',
      key: 'fuelConsumption',
      width: 140,
      render: (consumption: number, record: Vehicle) => {
        const avgConsumption = parseFloat(fleetStats.averageFuelConsumption);
        const isEfficient = consumption < avgConsumption;
        return (
          <div>
            <div style={{ color: isEfficient ? '#00d084' : '#595959', fontWeight: 500 }}>
              {consumption.toFixed(1)} L/100km
            </div>
            {record.status === 'Active' && (
              <Progress
                percent={Math.min((consumption / 25) * 100, 100)}
                showInfo={false}
                strokeColor={isEfficient ? '#00d084' : '#ff6900'}
                trailColor="#f0f0f0"
                size="small"
              />
            )}
          </div>
        );
      },
      sorter: (a, b) => a.fuelConsumption - b.fuelConsumption,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusTag status={status} />,
      filters: vehicleStatuses.map((status) => ({ text: status, value: status })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record: Vehicle) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            style={{ color: '#0693e3' }}
            title="View Details"
            onClick={() => handleViewDetails(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<ToolOutlined />}
            style={{ color: '#ff6900' }}
            title="Schedule Service"
            onClick={() => openScheduleService(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<UserAddOutlined />}
            style={{ color: '#00d084' }}
            title="Assign Driver"
            onClick={() => openAssignDriver(record)}
          />
        </Space>
      ),
    },
  ];

  // Service schedule columns
  const serviceColumns: ColumnsType<ServiceSchedule> = [
    {
      title: 'Service ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <span style={{ fontWeight: 600, color: '#32373c' }}>{id}</span>,
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleName',
      key: 'vehicleName',
      width: 180,
      render: (name: string, record: ServiceSchedule) => (
        <div>
          <div style={{ fontWeight: 500, color: '#32373c' }}>{name}</div>
          <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.licensePlate}</Text>
        </div>
      ),
    },
    {
      title: 'Service Type',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 200,
      render: (type: string) => <span style={{ color: '#595959' }}>{type}</span>,
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 130,
      render: (date: string) => (
        <span style={{ color: '#595959', fontWeight: 500 }}>
          {new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
    },
    {
      title: 'Estimated Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 130,
      render: (cost: number) => (
        <span style={{ color: '#32373c', fontWeight: 600 }}>ZWG{cost.toLocaleString()}</span>
      ),
      sorter: (a, b) => a.estimatedCost - b.estimatedCost,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      render: (notes?: string) => (
        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>{notes || '-'}</Text>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fleet Management"
        subtitle={`${filteredVehicles.length} vehicle${filteredVehicles.length !== 1 ? 's' : ''} • Total Mileage: ${fleetStats.totalMileage.toLocaleString()} km • Fuel Cost This Month: ZWG ${fleetStats.fuelCostThisMonth.toLocaleString()}`}
        breadcrumbs={[{ title: 'Assets' }, { title: 'Fleet Management' }]}
        actions={
          <>
            <Button icon={<DownloadOutlined />} style={{ borderRadius: '8px' }}>
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddVehicleModalVisible(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff6900 0%, #ff8534 100%)',
                border: 'none',
              }}
            >
              Add Vehicle
            </Button>
          </>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Vehicles"
            value={fleetStats.totalVehicles}
            icon={<CarOutlined />}
            iconBg="rgba(6, 147, 227, 0.1)"
            style={{ height: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active"
            value={fleetStats.active}
            icon={<CheckCircleOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
            style={{ height: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Under Maintenance"
            value={fleetStats.underMaintenance}
            icon={<ToolOutlined />}
            iconBg="rgba(255, 105, 0, 0.1)"
            style={{ height: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Fuel Cost This Month"
            value={fleetStats.fuelCostThisMonth.toLocaleString()}
            prefix="ZWG"
            icon={<FireOutlined />}
            cardBg="linear-gradient(135deg, #ff6900 0%, #ff8534 100%)"
            style={{ height: '100%' }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Mileage"
            value={fleetStats.totalMileage.toLocaleString()}
            suffix="km"
            icon={<DashboardOutlined />}
            cardBg="linear-gradient(135deg, #00d084 0%, #00BFA5 100%)"
            style={{ height: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={18}>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(155, 81, 224, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#9b51e0',
                }}
              >
                <WarningOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ color: '#8c8c8c', fontSize: '14px', fontWeight: 500 }}>
                  Service Alerts
                </Text>
                <div style={{ color: '#32373c', fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>
                  {mockServiceSchedule.length} vehicles need servicing soon
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Fleet List Section */}
      <div
        style={{
          background: 'white',
          padding: '20px 24px 8px',
          borderRadius: '12px 12px 0 0',
          marginBottom: '-20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#32373c',
            marginBottom: '16px',
          }}
        >
          Fleet List
        </div>
      </div>

      <FilterBar filters={filters} onSearch={setSearchTerm} onReset={handleReset} />

      <DataTable columns={columns} dataSource={filteredVehicles} rowKey="id" scroll={{ x: 1600 }} />

      {/* Service Schedule Section */}
      <div
        style={{
          marginTop: '32px',
          background: 'white',
          padding: '20px 24px 8px',
          borderRadius: '12px 12px 0 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ClockCircleOutlined style={{ fontSize: '20px', color: '#ff6900' }} />
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#32373c' }}>
            Upcoming Service Schedule
          </div>
        </div>
      </div>

      <DataTable
        columns={serviceColumns}
        dataSource={mockServiceSchedule}
        rowKey="id"
        scroll={{ x: 1200 }}
        cardStyle={{ marginTop: '-20px' }}
      />

      {/* Add Vehicle Modal */}
      <Modal
        title="Add New Vehicle"
        open={addVehicleModalVisible}
        onCancel={() => {
          setAddVehicleModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        width={800}
        okText="Add Vehicle"
      >
        <Form form={form} layout="vertical" onFinish={handleAddVehicle}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Vehicle Name" name="vehicleName" rules={[{ required: true }]}>
                <Input placeholder="e.g., Toyota Camry 2024" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="License Plate" name="licensePlate" rules={[{ required: true }]}>
                <Input placeholder="e.g., ABC-1234" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Vehicle Type" name="type" rules={[{ required: true }]}>
                <Select placeholder="Select type" size="large">
                  {vehicleTypes.map((type) => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Model/Year" name="model" rules={[{ required: true }]}>
                <Input placeholder="e.g., 2024 Model" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Current Mileage (km)" name="currentMileage" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} size="large" min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Fuel Consumption (L/100km)" name="fuelConsumption">
                <InputNumber style={{ width: '100%' }} size="large" min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select placeholder="Select status" size="large">
                  {vehicleStatuses.map((status) => (
                    <Select.Option key={status} value={status}>{status}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Additional Notes" name="notes">
            <TextArea rows={3} placeholder="Any additional information..." maxLength={300} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        title={`Assign Driver: ${selectedVehicle?.vehicleName || ''}`}
        open={assignDriverModalVisible}
        onCancel={() => {
          setAssignDriverModalVisible(false);
          assignForm.resetFields();
        }}
        onOk={assignForm.submit}
        width={500}
        okText="Assign Driver"
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignDriver}>
          <Form.Item label="Select Driver" name="driver" rules={[{ required: true }]}>
            <Select placeholder="Select driver" size="large" showSearch>
              {availableDrivers.map((driver) => (
                <Select.Option key={driver.id} value={driver.id}>
                  {driver.name} - {driver.experience}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Assignment Date" name="assignmentDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Purpose/Notes" name="purpose">
            <TextArea rows={3} placeholder="Purpose of assignment..." maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* Schedule Service Modal */}
      <Modal
        title={`Schedule Service: ${selectedVehicle?.vehicleName || ''}`}
        open={scheduleServiceModalVisible}
        onCancel={() => {
          setScheduleServiceModalVisible(false);
          serviceForm.resetFields();
        }}
        onOk={serviceForm.submit}
        width={600}
        okText="Schedule Service"
      >
        <Form form={serviceForm} layout="vertical" onFinish={handleScheduleService}>
          <Form.Item label="Service Type" name="serviceType" rules={[{ required: true }]}>
            <Select placeholder="Select service type" size="large">
              <Select.Option value="Regular Maintenance">Regular Maintenance</Select.Option>
              <Select.Option value="Oil Change">Oil Change</Select.Option>
              <Select.Option value="Tire Replacement">Tire Replacement</Select.Option>
              <Select.Option value="Brake Service">Brake Service</Select.Option>
              <Select.Option value="Engine Repair">Engine Repair</Select.Option>
              <Select.Option value="Body Work">Body Work</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Scheduled Date" name="scheduledDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Service Provider" name="provider">
            <Input placeholder="Garage/Service center name" size="large" />
          </Form.Item>
          <Form.Item label="Estimated Cost (ZWG)" name="estimatedCost">
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={0}
              formatter={(value) => `ZWG ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/ZWG\s?|(,*)/g, '') as any}
            />
          </Form.Item>
          <Form.Item label="Service Notes" name="notes">
            <TextArea rows={3} placeholder="Additional notes or requirements..." maxLength={300} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* Vehicle Details Drawer */}
      <Drawer
        title="Vehicle Details"
        placement="right"
        width={600}
        onClose={() => setDetailsDrawerVisible(false)}
        open={detailsDrawerVisible}
      >
        {selectedVehicle && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Vehicle ID" span={2}>{selectedVehicle.id}</Descriptions.Item>
              <Descriptions.Item label="Vehicle Name" span={2}>
                <Text strong>{selectedVehicle.vehicleName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="License Plate">
                <Tag style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedVehicle.licensePlate}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Type">{selectedVehicle.type}</Descriptions.Item>
              <Descriptions.Item label="Model" span={2}>{selectedVehicle.model}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedVehicle.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Assigned Driver">
                {selectedVehicle.assignedDriver}
              </Descriptions.Item>
              <Descriptions.Item label="Current Mileage">
                <Text strong>{selectedVehicle.currentMileage.toLocaleString()} km</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Fuel Consumption">
                {selectedVehicle.fuelConsumption.toFixed(1)} L/100km
              </Descriptions.Item>
              <Descriptions.Item label="Last Service">
                {new Date(selectedVehicle.lastServiceDate).toLocaleDateString('en-GB')}
              </Descriptions.Item>
              <Descriptions.Item label="Next Service Due">
                {new Date(selectedVehicle.nextServiceDue).toLocaleDateString('en-GB')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px' }}>
              <Space style={{ width: '100%' }} direction="vertical">
                <Button
                  block
                  size="large"
                  icon={<UserAddOutlined />}
                  onClick={() => {
                    setDetailsDrawerVisible(false);
                    openAssignDriver(selectedVehicle);
                  }}
                >
                  Assign Driver
                </Button>
                <Button
                  block
                  size="large"
                  icon={<ToolOutlined />}
                  onClick={() => {
                    setDetailsDrawerVisible(false);
                    openScheduleService(selectedVehicle);
                  }}
                >
                  Schedule Service
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
