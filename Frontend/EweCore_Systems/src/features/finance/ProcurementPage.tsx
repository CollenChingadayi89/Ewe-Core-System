import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Avatar, Space, Row, Col, Tag, Modal, Form, Input, Select, DatePicker, InputNumber, message, Card, Typography, Divider, Checkbox, Radio, Upload } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { procurementCategories, procurementStats } from '../../mock/procurement';
import type { ProcurementRequest } from '../../mock/procurement';
import { useProcurementStore } from '../../store/procurementStore';
import { useAuthStore } from '../../store/authStore';
import { employeeApi, type EmployeeListResponse } from '../../services/api/employees';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';
import { ProcurementDetailsDrawer } from './ProcurementDetailsDrawer';
import {
  PROCUREMENT_CURRENCIES,
  QUOTATION_ALLOWED_EXTENSIONS,
  QUOTATION_MAX_FILE_SIZE_BYTES,
  type ProcurementCreateRequest,
} from '../../services/api/procurement';

const { TextArea } = Input;
const { Text, Title } = Typography;

export const ProcurementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [costRange, setCostRange] = useState<[number, number] | undefined>(undefined);
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeListResponse[]>([]);
  const [isForEmployee, setIsForEmployee] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('ZWG');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Zustand stores
  const {
    procurementRequests,
    loading,
    error,
    fetchRequests,
    createRequest,
    deleteRequest,
  } = useProcurementStore();

  const { user } = useAuthStore();

  // Fetch employees list for assignment
  const fetchEmployeesList = useCallback(async () => {
    try {
      const response = await employeeApi.list({ page_size: 500 });
      setEmployees(response.results);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  // Fetch procurement requests and employees on mount
  useEffect(() => {
    fetchRequests();
    fetchEmployeesList();
  }, [fetchRequests, fetchEmployeesList]);

  // Map API procurement to component format
  const mapApiProcurementToComponent = (apiProcurement: any): ProcurementRequest => ({
    id: apiProcurement.request_number || apiProcurement.id,
    itemDescription: apiProcurement.description || apiProcurement.item_description || 'N/A',
    requestedBy: apiProcurement.employee_name || apiProcurement.requested_by_name || 'Unknown',
    department: apiProcurement.employee_department || apiProcurement.department_name || 'N/A',
    category: apiProcurement.category_display || apiProcurement.category || 'Other',
    quantity: apiProcurement.quantity || 1,
    estimatedCost: parseFloat(apiProcurement.estimated_total_cost || apiProcurement.total_amount || apiProcurement.amount) || 0,
    currency: apiProcurement.currency || 'ZWG',
    requestedDate: apiProcurement.request_date ? dayjs(apiProcurement.request_date).format('DD/MM/YYYY') : '',
    requiredByDate: apiProcurement.required_by_date ? dayjs(apiProcurement.required_by_date).format('DD/MM/YYYY') : '',
    status: apiProcurement.status_display || apiProcurement.status || 'Pending',
    vendor: apiProcurement.preferred_vendor || undefined,
    avatar: (apiProcurement.employee_name || apiProcurement.requested_by_name || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase(),
  });

  const mappedRequests = procurementRequests.map(mapApiProcurementToComponent);

  // Filter procurement requests
  const filteredRequests = mappedRequests.filter((request) => {
    const matchesSearch =
      request.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesCategory = !categoryFilter || request.category === categoryFilter;
    const matchesDepartment = !departmentFilter || request.department === departmentFilter;
    const matchesCurrency = currencyFilter === 'all' || request.currency === currencyFilter;

    // Date range filter (using requested date)
    let matchesDate = true;
    if (dateRange && dateRange.length === 2) {
      const requestDate = new Date(request.requestedDate);
      const startDate = dateRange[0]?.toDate();
      const endDate = dateRange[1]?.toDate();
      matchesDate = requestDate >= startDate && requestDate <= endDate;
    }

    // Cost range filter
    let matchesCost = true;
    if (costRange) {
      matchesCost = request.estimatedCost >= costRange[0] && request.estimatedCost <= costRange[1];
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesCurrency && matchesDate && matchesCost;
  });

  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search by item, requester, vendor, or ID...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 320,
    },
    {
      type: 'dateRange',
      label: 'Date Range',
      onChange: setDateRange,
      value: dateRange,
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 150,
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Ordered', value: 'Ordered' },
        { label: 'Received', value: 'Received' },
        { label: 'Rejected', value: 'Rejected' },
      ],
    },
    {
      type: 'select',
      label: 'Category',
      placeholder: 'All Categories',
      onChange: setCategoryFilter,
      value: categoryFilter,
      width: 180,
      options: procurementCategories.map((cat) => ({ label: cat, value: cat })),
    },
    {
      type: 'select',
      label: 'Department',
      placeholder: 'All Departments',
      onChange: setDepartmentFilter,
      value: departmentFilter,
      width: 180,
      options: [
        { label: 'IT', value: 'IT' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Human Resources', value: 'Human Resources' },
        { label: 'Operations', value: 'Operations' },
        { label: 'Compliance & Risk', value: 'Compliance & Risk' },
      ],
    },
  ];

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setCategoryFilter(undefined);
    setDepartmentFilter(undefined);
    setDateRange(undefined);
    setCostRange(undefined);
    setCurrencyFilter('all');
  };

  // The file picker's `accept` filter can be bypassed, so re-check type and size before upload
  const validateQuotationDocument = async (_: unknown, fileList?: UploadFile[]) => {
    const file = fileList?.[0]?.originFileObj;
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!QUOTATION_ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error('Only PDF, Word, Excel or image files are allowed');
    }
    if (file.size > QUOTATION_MAX_FILE_SIZE_BYTES) {
      throw new Error('File must be 10 MB or smaller');
    }
  };

  // Handle request submission
  const handleSubmitRequest = async (values: any) => {
    try {
      // Get current user from auth store
      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.id) {
        message.error('Unable to identify current user. Please log in again.');
        return;
      }

      // Map line items with proper structure
      const lineItemsArray = Array.isArray(values.line_items) ? values.line_items : [];
      const lineItems = lineItemsArray.map((item: any) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        unit_price: parseFloat(item.unit_price),
        amount: parseFloat(item.amount),
      }));

      // Each quotation's document is uploaded alongside the request, in the same order
      const quotationsArray = Array.isArray(values.quotations) ? values.quotations : [];
      const quotationDocuments: File[] = [];
      for (const q of quotationsArray) {
        const file = (q.document as UploadFile[] | undefined)?.[0]?.originFileObj;
        if (!file) {
          message.error(`Please upload a document for quotation from "${q.vendor_name}".`);
          return;
        }
        quotationDocuments.push(file);
      }
      const quotations = quotationsArray.map((q: any) => ({
        vendor_name: q.vendor_name,
        is_selected: false, // No winner selection at request stage
      }));

      // Calculate total from line items
      const calculatedTotal = lineItems.reduce((sum: number, item: any) => sum + item.amount, 0);

      const requestData: ProcurementCreateRequest = {
        requested_by: currentUser.id,
        item_description: values.item_description,
        category: values.category,
        line_items: lineItems,
        total_amount: calculatedTotal,
        currency: values.currency || 'ZWG',
        is_for_employee: values.is_for_employee || false,
        assigned_employees: values.assigned_employees || [],
        quotations: quotations,
        business_justification: values.business_justification,
        technical_specifications: values.technical_specifications || '',
        delivery_location: values.delivery_location || '',
        request_type: values.request_type,
        required_by_date: values.required_by_date.format('YYYY-MM-DD'),
        priority: values.priority,
        notes: values.notes || '',
        status: 'pending',
      };

      setSubmitting(true);
      const result = await createRequest(requestData, quotationDocuments);

      if (result) {
        setRequestModalVisible(false);
        form.resetFields();
        setIsForEmployee(false);
        setSelectedCurrency('ZWG');
        message.success('Procurement request created successfully');
      }
    } catch (error: any) {
      console.error('Failed to submit procurement request:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create procurement request';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view details. Table rows are keyed by request_number (see mapApiProcurementToComponent),
  // so resolve back to the full API record for the drawer.
  const handleViewDetails = (request: ProcurementRequest) => {
    const apiRecord = procurementRequests.find((r) => (r.request_number || r.id) === request.id);
    if (!apiRecord) {
      message.error('Unable to load request details. Please refresh and try again.');
      return;
    }
    setSelectedRequestId(apiRecord.id);
    setDetailsDrawerVisible(true);
  };

  // Derived from the store so the drawer reflects the latest fetched data
  const selectedRequest = procurementRequests.find((r) => r.id === selectedRequestId) ?? null;

  const employeeNames = useMemo(
    () => Object.fromEntries(employees.map((emp) => [emp.id, `${emp.first_name} ${emp.last_name}`])),
    [employees]
  );

  // Priority badge color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return { bg: 'rgba(207, 46, 46, 0.1)', color: '#cf2e2e' };
      case 'High':
        return { bg: 'rgba(255, 105, 0, 0.1)', color: '#ff6900' };
      case 'Medium':
        return { bg: 'rgba(6, 147, 227, 0.1)', color: '#0693e3' };
      case 'Low':
        return { bg: 'rgba(0, 208, 132, 0.1)', color: '#00d084' };
      default:
        return { bg: 'rgba(140, 140, 140, 0.1)', color: '#8c8c8c' };
    }
  };

  // Table columns
  const columns: ColumnsType<ProcurementRequest> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
      render: (id: string) => (
        <span style={{ fontWeight: 600, color: '#0693e3', cursor: 'pointer' }}>
          {id}
        </span>
      ),
    },
    {
      title: 'Item/Description',
      dataIndex: 'itemDescription',
      key: 'itemDescription',
      width: 280,
      ellipsis: true,
      render: (desc: string, record: ProcurementRequest) => (
        <div>
          <div style={{ fontWeight: 500, color: '#32373c', marginBottom: '4px' }}>
            {desc}
          </div>
          <Tag
            style={{
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              border: 'none',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              color: '#0693e3',
              fontWeight: 500,
            }}
          >
            {record.category}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      width: 200,
      render: (name: string, record: ProcurementRequest) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar
            size={36}
            style={{
              background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
              color: 'white',
              fontWeight: 600,
            }}
          >
            {name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, color: '#32373c' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.department}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (qty: number, record: ProcurementRequest) => (
        <span style={{ color: '#595959', fontWeight: 500 }}>
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: 'Estimated Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 130,
      align: 'right',
      render: (cost: number, record: ProcurementRequest) => (
        <span style={{ fontWeight: 600, color: '#32373c', fontSize: '13px' }}>
          {record.currency} {cost.toLocaleString()}
        </span>
      ),
      sorter: (a, b) => a.estimatedCost - b.estimatedCost,
    },
    {
      title: 'Requested Date',
      dataIndex: 'requestedDate',
      key: 'requestedDate',
      width: 120,
      render: (date: string) => (
        <span style={{ color: '#595959' }}>
          {new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime(),
    },
    {
      title: 'Required By',
      dataIndex: 'requiredByDate',
      key: 'requiredByDate',
      width: 120,
      render: (date: string) => {
        const reqDate = new Date(date);
        const today = new Date();
        const daysUntil = Math.ceil((reqDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysUntil <= 7 && daysUntil > 0;
        const isOverdue = daysUntil < 0;

        return (
          <div>
            <div style={{ color: isOverdue ? '#cf2e2e' : isUrgent ? '#ff6900' : '#595959' }}>
              {new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            {isOverdue && (
              <div style={{ fontSize: '11px', color: '#cf2e2e' }}>Overdue</div>
            )}
            {isUrgent && !isOverdue && (
              <div style={{ fontSize: '11px', color: '#ff6900' }}>{daysUntil} days</div>
            )}
          </div>
        );
      },
      sorter: (a, b) => new Date(a.requiredByDate).getTime() - new Date(b.requiredByDate).getTime(),
    },
    {
      title: 'Vendor/Supplier',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 180,
      ellipsis: true,
      render: (vendor?: string) => (
        <span style={{ color: vendor ? '#595959' : '#d9d9d9' }}>
          {vendor || 'Not assigned'}
        </span>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const { bg, color } = getPriorityColor(priority);
        return (
          <Tag
            style={{
              borderRadius: '6px',
              padding: '4px 10px',
              border: 'none',
              background: bg,
              color: color,
              fontWeight: 500,
            }}
          >
            {priority}
          </Tag>
        );
      },
      filters: [
        { text: 'Urgent', value: 'Urgent' },
        { text: 'High', value: 'High' },
        { text: 'Medium', value: 'Medium' },
        { text: 'Low', value: 'Low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusTag status={status} />,
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Ordered', value: 'Ordered' },
        { text: 'Received', value: 'Received' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record: ProcurementRequest) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            style={{ color: '#0693e3' }}
            title="View Details"
            onClick={() => handleViewDetails(record)}
          />
          {record.status === 'Pending' && (
            <>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#00d084' }}
                title="Approve"
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                style={{ color: '#cf2e2e' }}
                title="Reject"
              />
            </>
          )}
          {record.status === 'Approved' && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: '#9b51e0' }}
              title="Edit"
            />
          )}
        </Space>
      ),
    },
  ];

  // Calculate summary stats
  const pendingCount = filteredRequests.filter((req) => req.status === 'Pending').length;
  const approvedCount = filteredRequests.filter((req) => req.status === 'Approved').length;
  const completedCount = filteredRequests.filter((req) => req.status === 'Received').length;
  const rejectedCount = filteredRequests.filter((req) => req.status === 'Rejected').length;

  // Amounts in different currencies can't be summed, so total each currency separately
  const costByCurrency = filteredRequests.reduce<Record<string, number>>((totals, req) => {
    const currency = req.currency || 'ZWG';
    totals[currency] = (totals[currency] || 0) + req.estimatedCost;
    return totals;
  }, {});
  const formatMoney = (currency: string, amount: number) =>
    `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const totalEstimatedCostDisplay = Object.keys(costByCurrency).length > 0
    ? Object.entries(costByCurrency)
        .sort(([a], [b]) => PROCUREMENT_CURRENCIES.indexOf(a) - PROCUREMENT_CURRENCIES.indexOf(b))
        .map(([currency, amount]) => formatMoney(currency, amount))
        .join(' | ')
    : formatMoney(currencyFilter === 'all' ? 'ZWG' : currencyFilter, 0);

  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle="Manage procurement requests and purchase orders"
        breadcrumbs={[
          { title: 'Finance' },
          { title: 'Procurement' },
        ]}
        actions={
          <>
            <Select
              value={currencyFilter}
              onChange={setCurrencyFilter}
              style={{ width: 160 }}
              size="large"
              aria-label="Filter by currency"
              options={[
                { value: 'all', label: 'All Currencies' },
                ...PROCUREMENT_CURRENCIES.map((currency) => ({ value: currency, label: `${currency} Only` })),
              ]}
            />
            <Button
              icon={<DownloadOutlined />}
              style={{ borderRadius: '8px' }}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setRequestModalVisible(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
              }}
            >
              New Procurement Request
            </Button>
          </>
        }
      />

      {/* Summary Statistics */}
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Total Requests"
              value={filteredRequests.length}
              icon={<FileTextOutlined />}
              iconBg="rgba(6, 147, 227, 0.1)"
              iconColor="#0693e3"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Pending Approval"
              value={pendingCount}
              icon={<ClockCircleOutlined />}
              iconBg="rgba(255, 105, 0, 0.1)"
              iconColor="#ff6900"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Approved"
              value={approvedCount}
              icon={<CheckCircleOutlined />}
              iconBg="rgba(0, 208, 132, 0.1)"
              iconColor="#00d084"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Completed"
              value={completedCount}
              icon={<InboxOutlined />}
              iconBg="rgba(155, 81, 224, 0.1)"
              iconColor="#9b51e0"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Rejected"
              value={rejectedCount}
              icon={<CloseOutlined />}
              iconBg="rgba(207, 46, 46, 0.1)"
              iconColor="#cf2e2e"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <StatCard
              title="Total Est. Cost"
              value={totalEstimatedCostDisplay}
              icon={<ShoppingCartOutlined />}
              cardBg="linear-gradient(135deg, #00d084 0%, #00BFA5 100%)"
            />
          </Col>
        </Row>
      </div>

      <FilterBar
        filters={filters}
        onSearch={setSearchTerm}
        onReset={handleReset}
      />

      <DataTable
        columns={columns}
        dataSource={filteredRequests}
        rowKey="id"
        scroll={{ x: 1800 }}
      />

      {/* Request Modal */}
      <Modal
        title="New Procurement Request"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
          setIsForEmployee(false);
          setSelectedCurrency('ZWG');
        }}
        onOk={form.submit}
        confirmLoading={submitting}
        width={1400}
        okText="Submit Request"
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRequest}
          initialValues={{
            quotations: [{ is_selected: false }, { is_selected: false }, { is_selected: false }],
            is_for_employee: false,
            request_type: 'new',
            priority: 'medium'
          }}
        >
          {/* Section 1: Request Type & Assignment */}
          <Title level={5}>Section 1: Request Type & Assignment</Title>

          <Row gutter={24}>
            <Col span={12}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="request_type"
                    label="Request Type"
                    rules={[{ required: true, message: 'Request type is required' }]}
                  >
                    <Select>
                      <Select.Option value="new">New Purchase</Select.Option>
                      <Select.Option value="replacement">Replacement</Select.Option>
                      <Select.Option value="rental">Rental</Select.Option>
                      <Select.Option value="lease">Lease</Select.Option>
                      <Select.Option value="service">Service Contract</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Category is required' }]}
                  >
                    <Select placeholder="Select category">
                      {procurementCategories.map((cat) => (
                        <Select.Option key={cat.value} value={cat.value}>
                          {cat.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="item_description"
                label="Item/Service Description"
                rules={[{ required: true, message: 'Item description is required' }]}
              >
                <TextArea rows={3} maxLength={500} placeholder="Describe the item or service to be procured" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: 'Currency is required' }]}
                initialValue="ZWG"
              >
                <Select
                  placeholder="Select currency"
                  onChange={(value) => setSelectedCurrency(value)}
                >
                  <Select.Option value="ZWG">ZWG - Zimbabwe Gold</Select.Option>
                  <Select.Option value="USD">USD - US Dollar</Select.Option>
                  <Select.Option value="ZAR">ZAR - South African Rand</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="technical_specifications"
                label="Technical Specifications"
              >
                <TextArea rows={3} maxLength={500} placeholder="Detailed technical requirements, specifications, or features..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="is_for_employee"
                label="Is this procurement for specific employee(s)?"
              >
                <Radio.Group onChange={(e) => setIsForEmployee(e.target.value)}>
                  <Radio value={false}>For Organization</Radio>
                  <Radio value={true}>For Specific Employee(s)</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              {isForEmployee && (
                <Form.Item
                  name="assigned_employees"
                  label="Select Employees"
                  rules={[{ required: true, message: 'Please select at least one employee' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select employees"
                    filterOption={(input, option) =>
                      (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {employees.map((emp) => (
                      <Select.Option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_number})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Col>
          </Row>

          <Divider />

          {/* Section 2: Line Items */}
          <Title level={5}>Section 2: Line Items</Title>

          <Form.List
            name="line_items"
            rules={[
              {
                validator: async (_, lineItems) => {
                  if (!lineItems || lineItems.length < 1) {
                    return Promise.reject(new Error('At least one line item is required'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`Line Item #${index + 1}`}
                    extra={
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          remove(field.name);
                          // Recalculate grand total after removal
                          setTimeout(() => {
                            const lineItems = form.getFieldValue('line_items') || [];
                            const grandTotal = lineItems.reduce((sum: number, item: any) => {
                              return sum + (parseFloat(item?.amount || 0));
                            }, 0);
                            form.setFieldValue('total_amount', grandTotal);
                          }, 0);
                        }}
                      >
                        Remove
                      </Button>
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item
                          name={[field.name, 'description']}
                          label="Description"
                          rules={[{ required: true, message: 'Please enter description' }]}
                        >
                          <Input placeholder="Item description" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name={[field.name, 'quantity']}
                          label="Quantity"
                          rules={[
                            { required: true, message: 'Required' },
                            { type: 'number', min: 0.01, message: 'Must be > 0' },
                          ]}
                        >
                          <InputNumber
                            min={0.01}
                            step={1}
                            style={{ width: '100%' }}
                            placeholder="Qty"
                            onChange={(value) => {
                              const unitPrice = form.getFieldValue(['line_items', field.name, 'unit_price']) || 0;
                              const calculatedAmount = (value || 0) * unitPrice;
                              form.setFieldValue(['line_items', field.name, 'amount'], calculatedAmount);

                              // Update grand total
                              const lineItems = form.getFieldValue('line_items') || [];
                              const grandTotal = lineItems.reduce((sum: number, item: any) => {
                                return sum + (parseFloat(item?.amount || 0));
                              }, 0);
                              form.setFieldValue('total_amount', grandTotal);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name={[field.name, 'unit']}
                          label="Unit"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Select placeholder="Select unit">
                            <Select.Option value="pcs">Pieces</Select.Option>
                            <Select.Option value="boxes">Boxes</Select.Option>
                            <Select.Option value="units">Units</Select.Option>
                            <Select.Option value="sets">Sets</Select.Option>
                            <Select.Option value="kg">Kg</Select.Option>
                            <Select.Option value="liters">Liters</Select.Option>
                            <Select.Option value="meters">Meters</Select.Option>
                            <Select.Option value="services">Services</Select.Option>
                            <Select.Option value="licenses">Licenses</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name={[field.name, 'unit_price']}
                          label={`Unit Price (${selectedCurrency})`}
                          rules={[
                            { required: true, message: 'Required' },
                            { type: 'number', min: 0, message: 'Must be >= 0' },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="Price"
                            onChange={(value) => {
                              const quantity = form.getFieldValue(['line_items', field.name, 'quantity']) || 0;
                              const calculatedAmount = quantity * (value || 0);
                              form.setFieldValue(['line_items', field.name, 'amount'], calculatedAmount);

                              // Update grand total
                              const lineItems = form.getFieldValue('line_items') || [];
                              const grandTotal = lineItems.reduce((sum: number, item: any) => {
                                return sum + (parseFloat(item?.amount || 0));
                              }, 0);
                              form.setFieldValue('total_amount', grandTotal);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name={[field.name, 'amount']}
                          label={`Amount (${selectedCurrency})`}
                        >
                          <InputNumber
                            disabled
                            precision={2}
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ description: '', quantity: 1, unit: 'pcs', unit_price: 0, amount: 0 })}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Line Item
                </Button>
                <Form.ErrorList errors={errors} />

                {/* Grand Total */}
                {fields.length > 0 && (
                  <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
                    <Row justify="end">
                      <Col>
                        <Text strong style={{ fontSize: 16 }}>
                          Grand Total: {selectedCurrency}{' '}
                          {(() => {
                            const lineItems = form.getFieldValue('line_items') || [];
                            const total = lineItems.reduce((sum: number, item: any) => {
                              return sum + (parseFloat(item?.amount || 0));
                            }, 0);
                            return total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                          })()}
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                )}
              </>
            )}
          </Form.List>

          {/* Hidden field for total_amount. Must stay outside Form.List: fields rendered
              inside a list inherit its name prefix (becoming line_items.total_amount),
              which turns line_items into an object on submit and drops every row. */}
          <Form.Item name="total_amount" hidden>
            <InputNumber />
          </Form.Item>

          <Divider />

          {/* Section 3: Vendor Quotations (Document Upload Only) */}
          <Title level={5}>Section 3: Vendor Quotations (Minimum 3 Required - Upload Documents)</Title>

          <Form.List
            name="quotations"
            rules={[
              {
                validator: async (_, quotations) => {
                  if (!quotations || quotations.length < 3) {
                    return Promise.reject(new Error('Minimum 3 quotations required'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <Row gutter={[16, 16]}>
                  {fields.map((field, index) => (
                    <Col span={8} key={field.key}>
                      <Card
                        size="small"
                        title={`Quotation ${index + 1}`}
                        extra={
                          fields.length > 3 ? (
                            <Button type="link" danger size="small" onClick={() => remove(field.name)}>
                              Remove
                            </Button>
                          ) : null
                        }
                      >
                        <Form.Item
                          name={[field.name, 'vendor_name']}
                          label="Vendor Name"
                          rules={[{ required: true, message: 'Required' }]}
                          style={{ marginBottom: 8 }}
                        >
                          <Input placeholder="Vendor name" size="small" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'document']}
                          label="Upload Quotation"
                          rules={[
                            { required: true, message: 'Please upload quotation document' },
                            { validator: validateQuotationDocument },
                          ]}
                          valuePropName="fileList"
                          getValueFromEvent={(e) => {
                            if (Array.isArray(e)) return e;
                            return e?.fileList;
                          }}
                          extra="PDF, Word, Excel or image, up to 10 MB"
                          style={{ marginBottom: 0 }}
                        >
                          <Upload
                            beforeUpload={() => false}
                            maxCount={1}
                            accept={QUOTATION_ALLOWED_EXTENSIONS.join(',')}
                          >
                            <Button icon={<UploadOutlined />} size="small" block>
                              Upload Document
                            </Button>
                          </Upload>
                        </Form.Item>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                  Add Quotation
                </Button>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>

          <Divider />

          {/* Section 4: Timeline & Delivery */}
          <Title level={5}>Section 4: Timeline & Delivery</Title>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="required_by_date"
                label="Required By Date"
                rules={[{ required: true, message: 'Required by date is required' }]}
              >
                <DatePicker
                  style={{width: '100%'}}
                  format="DD/MM/YYYY"
                  disabledDate={(current) => {
                    return current && current < dayjs().add(14, 'days');
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Priority is required' }]}
              >
                <Select>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="urgent">Urgent</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="delivery_location" label="Delivery Location">
                <Input placeholder="Department or address" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* Section 5: Justification */}
          <Title level={5}>Section 5: Justification</Title>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="business_justification"
                label="Business Justification"
                rules={[
                  { required: true, message: 'Business justification required' },
                  {
                    validator: (_, value) => {
                      const priority = form.getFieldValue('priority');
                      if ((priority === 'high' || priority === 'urgent') && value && value.length < 100) {
                        return Promise.reject('High/Urgent priority requires at least 100 characters');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <TextArea rows={4} maxLength={1000} showCount placeholder="Why is this purchase necessary?" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Additional Notes">
                <TextArea rows={4} maxLength={500} placeholder="Any other relevant information..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <ProcurementDetailsDrawer
        request={selectedRequest}
        open={detailsDrawerVisible}
        onClose={() => setDetailsDrawerVisible(false)}
        employeeNames={employeeNames}
      />
    </div>
  );
};
