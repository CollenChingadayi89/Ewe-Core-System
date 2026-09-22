/**
 * Employees Page - Direct API Integration
 * No Zustand - uses local state + direct API calls
 */

import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Button,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  message,
  Spin,
  Alert,
  Pagination,
  Card,
  Typography,
  Tag,
  Space,
  Switch,
  InputNumber,
  Divider,
  Table,
  Popconfirm,
  Tabs,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common';
import employeeApiService from '../../services/api/employeeApi';
import dayjs from 'dayjs';
import type {
  EmployeeListItem,
  UserRole,
  EmploymentStatus,
  Gender,
  Department,
  Designation,
  EmployeeBankDetails,
  EmployeeEmergencyContact,
  EmployeeSalary,
  EmployeeDocument,
  EmployeeDocumentCreate,
} from '../../types/employee';
import type { UploadFile } from 'antd/es/upload/interface';

const { Text, Title } = Typography;

export const EmployeesPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Employee data state
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Supporting data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [designationsLoading, setDesignationsLoading] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<EmploymentStatus | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(true);

  // UI state
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Two-stage creation state
  const [creationStage, setCreationStage] = useState<'user' | 'employee'>('user');
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null);
  const [addEmployeeTab, setAddEmployeeTab] = useState('1');

  // Forms for each stage/tab
  const [userForm] = Form.useForm(); // Stage 1: User creation
  const [employeeForm] = Form.useForm(); // Stage 2: Tabs 1-3
  const [bankForm] = Form.useForm(); // Tab 4
  const [contactForm] = Form.useForm(); // Tab 5
  const [docForm] = Form.useForm(); // Tab 6
  const [salaryForm] = Form.useForm(); // Tab 7

  // Data for Stage 2 tabs 4-7
  const [tempBankDetails, setTempBankDetails] = useState<EmployeeBankDetails[]>([]);
  const [tempEmergencyContacts, setTempEmergencyContacts] = useState<EmployeeEmergencyContact[]>([]);
  const [tempDocuments, setTempDocuments] = useState<EmployeeDocument[]>([]);
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);
  const [addBankVisible, setAddBankVisible] = useState(false);
  const [editBankId, setEditBankId] = useState<string | null>(null);
  const [addContactVisible, setAddContactVisible] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [uploadDocVisible, setUploadDocVisible] = useState(false);
  const [addSalaryVisible, setAddSalaryVisible] = useState(false);

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedDepartment) filters.department = selectedDepartment;
      if (selectedRole) filters.role = selectedRole;
      if (selectedStatus) filters.employment_status = selectedStatus;
      if (isActiveFilter !== undefined) filters.is_active = isActiveFilter;
      filters.page = currentPage;
      filters.page_size = pageSize;
      filters.ordering = 'employee_number';

      const response = await employeeApiService.employees.list(filters);
      setEmployees(response.results);
      setTotal(response.count);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load employees';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const response = await employeeApiService.departments.list({ page_size: 1000 });
      setDepartments(response.results);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      message.error('Failed to load departments');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Fetch designations
  const fetchDesignations = async (departmentId?: string) => {
    setDesignationsLoading(true);
    try {
      const params = departmentId ? { department: departmentId, page_size: 1000 } : { page_size: 1000 };
      const response = await employeeApiService.designations.list(params);
      setDesignations(response.results);
    } catch (err) {
      console.error('Failed to fetch designations:', err);
      message.error('Failed to load designations');
    } finally {
      setDesignationsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
  }, []);

  // Fetch employees when filters change
  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, selectedDepartment, selectedRole, selectedStatus, isActiveFilter, currentPage, pageSize]);

  // Filter designations when department changes in form
  const [filteredDesignations, setFilteredDesignations] = useState(designations);
  const handleDepartmentChange = (deptId: string) => {
    form.setFieldsValue({ designation: undefined });
    fetchDesignations(deptId);
  };

  useEffect(() => {
    const deptId = form.getFieldValue('department');
    if (deptId) {
      setFilteredDesignations(designations.filter(d => d.department === deptId));
    } else {
      setFilteredDesignations(designations);
    }
  }, [designations, form]);

  // Reset filters
  const handleReset = () => {
    setSearchTerm('');
    setSelectedDepartment(undefined);
    setSelectedRole(undefined);
    setSelectedStatus(undefined);
    setIsActiveFilter(true);
    setCurrentPage(1);
  };

  // Handle pagination change
  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
  };

  // Handle create employee
  const handleAddEmployee = async (values: any) => {
    try {
      const employeeData = {
        user: values.user,
        employee_number: values.employeeNumber || `EMP${Date.now().toString().slice(-6)}`,
        first_name: values.firstName,
        middle_name: values.middleName,
        last_name: values.lastName,
        gender: values.gender as Gender,
        phone: values.phone,
        personal_email: values.personalEmail,
        department: values.department,
        designation: values.designation,
        role: values.role as UserRole,
        reports_to: values.reportsTo || null,
        employment_status: values.employmentStatus as EmploymentStatus,
        join_date: values.joinDate ? dayjs(values.joinDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        nationality: values.nationality || 'Zimbabwe',
        country: values.country || 'Zimbabwe',
        is_active: true,
      };

      await employeeApiService.employees.create(employeeData);

      message.success('Employee created successfully');
      setAddModalVisible(false);
      form.resetFields();
      fetchEmployees(); // Refresh list
    } catch (err: any) {
      console.error('Failed to create employee:', err);
      const fieldErrors = err.response?.data;

      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            message.error(`${field}: ${errors.join(', ')}`);
          }
        });
      } else {
        message.error('Failed to create employee');
      }
    }
  };

  // ====== TWO-STAGE EMPLOYEE CREATION HANDLERS ======

  // STAGE 1: Create User Account
  const handleCreateUser = async (values: any) => {
    try {
      const response = await employeeApiService.users.create({
        email: values.email,
        password: values.password,
        password_confirm: values.password_confirm,
      });

      setCreatedUserId(response.user.id);
      setCreationStage('employee');
      userForm.resetFields();
      message.success(`User ${response.user.email} created! Now complete employee profile.`);
    } catch (err: any) {
      const fieldErrors = err.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            message.error(`${field}: ${errors.join(', ')}`);
          }
        });
      } else {
        message.error('Failed to create user account');
      }
    }
  };

  // STAGE 2: Create Employee Profile (Tabs 1-3)
  const handleCreateEmployee = async () => {
    try {
      const values = await employeeForm.validateFields();

      const employeeData = {
        user: createdUserId,
        employee_number: values.employee_number || `EMP${Date.now().toString().slice(-6)}`,
        first_name: values.first_name,
        middle_name: values.middle_name,
        last_name: values.last_name,
        gender: values.gender,
        date_of_birth: values.date_of_birth ? dayjs(values.date_of_birth).format('YYYY-MM-DD') : null,
        nationality: values.nationality,
        marital_status: values.marital_status,
        religion: values.religion,
        blood_group: values.blood_group,
        number_of_children: values.number_of_children || 0,
        spouse_employed: values.spouse_employed || false,
        phone: values.phone,
        personal_email: values.personal_email,
        address: values.address,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        country: values.country || 'Zimbabwe',
        bio: values.bio,
        department: values.department,
        designation: values.designation,
        role: values.role,
        reports_to: values.reports_to,
        employment_status: values.employment_status,
        join_date: values.join_date ? dayjs(values.join_date).format('YYYY-MM-DD') : null,
        confirmation_date: values.confirmation_date ? dayjs(values.confirmation_date).format('YYYY-MM-DD') : null,
        probation_end_date: values.probation_end_date ? dayjs(values.probation_end_date).format('YYYY-MM-DD') : null,
        contract_start_date: values.contract_start_date ? dayjs(values.contract_start_date).format('YYYY-MM-DD') : null,
        contract_end_date: values.contract_end_date ? dayjs(values.contract_end_date).format('YYYY-MM-DD') : null,
        national_id: values.national_id,
        passport_number: values.passport_number,
        passport_expiry_date: values.passport_expiry_date ? dayjs(values.passport_expiry_date).format('YYYY-MM-DD') : null,
        work_permit_number: values.work_permit_number,
        work_permit_expiry_date: values.work_permit_expiry_date ? dayjs(values.work_permit_expiry_date).format('YYYY-MM-DD') : null,
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      const employee = await employeeApiService.employees.create(employeeData);
      setCreatedEmployeeId(employee.id);

      // Save temporary bank details
      for (const bank of tempBankDetails) {
        if (bank.id.startsWith('temp-')) {
          const { id, ...bankData } = bank;
          await employeeApiService.bankDetails.create({ ...bankData, employee: employee.id });
        }
      }

      // Save temporary emergency contacts
      for (const contact of tempEmergencyContacts) {
        if (contact.id.startsWith('temp-')) {
          const { id, ...contactData } = contact;
          await employeeApiService.emergencyContacts.create({ ...contactData, employee: employee.id });
        }
      }

      message.success('Employee profile created successfully! All bank details and contacts have been saved.');

    } catch (err: any) {
      const fieldErrors = err.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            message.error(`${field}: ${errors.join(', ')}`);
          }
        });
      } else {
        message.error('Failed to create employee profile');
      }
    }
  };

  // TAB 4: Bank Details Handlers
  const handleAddBank = async (values: any) => {
    if (!createdEmployeeId) {
      // Store temporarily until employee is created
      const tempBank = {
        ...values,
        id: `temp-${Date.now()}`, // Temporary ID
      };
      setTempBankDetails([...tempBankDetails, tempBank]);
      message.success('Bank account added (will be saved when employee is created)');
      bankForm.resetFields();
      setAddBankVisible(false);
      return;
    }

    try {
      await employeeApiService.bankDetails.create({
        ...values,
        employee: createdEmployeeId,
      });
      message.success('Bank account added successfully');
      bankForm.resetFields();
      setAddBankVisible(false);
      // Refresh bank details
      const bankDetails = await employeeApiService.bankDetails.list(createdEmployeeId);
      setTempBankDetails(bankDetails.results);
    } catch (err: any) {
      message.error('Failed to add bank account');
    }
  };

  const handleUpdateBank = async (values: any) => {
    if (!editBankId) return;

    try {
      await employeeApiService.bankDetails.update(editBankId, values);
      message.success('Bank account updated successfully');
      bankForm.resetFields();
      setAddBankVisible(false);
      setEditBankId(null);
      // Refresh bank details
      const bankDetails = await employeeApiService.bankDetails.list(createdEmployeeId!);
      setTempBankDetails(bankDetails);
    } catch (err: any) {
      message.error('Failed to update bank account');
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    if (bankId.startsWith('temp-')) {
      // Remove from temporary storage
      setTempBankDetails(tempBankDetails.filter(b => b.id !== bankId));
      message.success('Bank account removed');
      return;
    }

    try {
      await employeeApiService.bankDetails.delete(bankId);
      message.success('Bank account deleted successfully');
      // Refresh bank details
      const bankDetails = await employeeApiService.bankDetails.list(createdEmployeeId!);
      setTempBankDetails(bankDetails.results);
    } catch (err: any) {
      message.error('Failed to delete bank account');
    }
  };

  const openEditBank = (bank: EmployeeBankDetails) => {
    setEditBankId(bank.id);
    bankForm.setFieldsValue({
      bank_name: bank.bank_name,
      branch: bank.branch,
      branch_code: bank.branch_code,
      account_number: bank.account_number,
      account_holder_name: bank.account_holder_name,
      swift_code: bank.swift_code,
      iban: bank.iban,
      account_type: bank.account_type,
      is_primary: bank.is_primary,
      is_active: bank.is_active,
    });
    setAddBankVisible(true);
  };

  // TAB 5: Emergency Contacts Handlers
  const handleAddContact = async (values: any) => {
    if (!createdEmployeeId) {
      // Store temporarily until employee is created
      const tempContact = {
        ...values,
        id: `temp-${Date.now()}`, // Temporary ID
      };
      setTempEmergencyContacts([...tempEmergencyContacts, tempContact]);
      message.success('Emergency contact added (will be saved when employee is created)');
      contactForm.resetFields();
      setAddContactVisible(false);
      return;
    }

    try {
      await employeeApiService.emergencyContacts.create({
        ...values,
        employee: createdEmployeeId,
      });
      message.success('Emergency contact added successfully');
      contactForm.resetFields();
      setAddContactVisible(false);
      // Refresh contacts
      const contacts = await employeeApiService.emergencyContacts.list(createdEmployeeId);
      setTempEmergencyContacts(contacts.results);
    } catch (err: any) {
      message.error('Failed to add emergency contact');
    }
  };

  const handleUpdateContact = async (values: any) => {
    if (!editContactId) return;

    try {
      await employeeApiService.emergencyContacts.update(editContactId, values);
      message.success('Emergency contact updated successfully');
      contactForm.resetFields();
      setAddContactVisible(false);
      setEditContactId(null);
      // Refresh contacts
      const contacts = await employeeApiService.emergencyContacts.list(createdEmployeeId!);
      setTempEmergencyContacts(contacts);
    } catch (err: any) {
      message.error('Failed to update emergency contact');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (contactId.startsWith('temp-')) {
      // Remove from temporary storage
      setTempEmergencyContacts(tempEmergencyContacts.filter(c => c.id !== contactId));
      message.success('Emergency contact removed');
      return;
    }

    try {
      await employeeApiService.emergencyContacts.delete(contactId);
      message.success('Emergency contact deleted successfully');
      // Refresh contacts
      const contacts = await employeeApiService.emergencyContacts.list(createdEmployeeId!);
      setTempEmergencyContacts(contacts.results);
    } catch (err: any) {
      message.error('Failed to delete emergency contact');
    }
  };

  const openEditContact = (contact: EmployeeEmergencyContact) => {
    setEditContactId(contact.id);
    contactForm.setFieldsValue({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      alternate_phone: contact.alternate_phone,
      email: contact.email,
      address: contact.address,
      is_primary: contact.is_primary,
    });
    setAddContactVisible(true);
  };

  // TAB 6: Documents Handlers
  const handleUploadDocument = async (values: any) => {
    if (!createdEmployeeId) {
      message.error('Please create employee profile first');
      return;
    }

    if (!uploadFileList || uploadFileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('employee', createdEmployeeId);
      formData.append('document_type', values.document_type);
      formData.append('title', values.title || '');
      formData.append('notes', values.notes || '');
      if (values.expiry_date) {
        formData.append('expiry_date', dayjs(values.expiry_date).format('YYYY-MM-DD'));
      }

      // Append file
      const file = uploadFileList[0].originFileObj;
      if (file) {
        formData.append('file', file);
      }

      await employeeApiService.documents.create(formData);
      message.success('Document uploaded successfully');
      docForm.resetFields();
      setUploadFileList([]);
      setUploadDocVisible(false);
      // Refresh documents
      const docs = await employeeApiService.documents.list(createdEmployeeId);
      setTempDocuments(docs);
    } catch (err: any) {
      message.error('Failed to upload document');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await employeeApiService.documents.delete(docId);
      message.success('Document deleted successfully');
      // Refresh documents
      const docs = await employeeApiService.documents.list(createdEmployeeId!);
      setTempDocuments(docs);
    } catch (err: any) {
      message.error('Failed to delete document');
    }
  };

  // TAB 7: Salary Handler
  const handleAddSalary = async (values: any) => {
    if (!createdEmployeeId) {
      message.error('Please create employee profile first');
      return;
    }

    try {
      await employeeApiService.salaries.create({
        ...values,
        employee: createdEmployeeId,
        effective_from: values.effective_from ? dayjs(values.effective_from).format('YYYY-MM-DD') : null,
      });
      message.success('Salary record added successfully');
      salaryForm.resetFields();
      setAddSalaryVisible(false);
      // Could refresh salary list here if needed
    } catch (err: any) {
      message.error('Failed to add salary record');
    }
  };

  // Cancel/Close handlers for Add Employee modal
  const handleCancelAddModal = () => {
    if (creationStage === 'employee' && createdUserId && !createdEmployeeId) {
      Modal.confirm({
        title: 'Incomplete Employee Profile',
        content: 'You created a user account but haven\'t completed the employee profile. Are you sure you want to cancel?',
        onOk: () => {
          setAddModalVisible(false);
          setCreationStage('user');
          setCreatedUserId(null);
          setCreatedEmployeeId(null);
          userForm.resetFields();
          employeeForm.resetFields();
          setAddEmployeeTab('1');
        },
      });
    } else {
      setAddModalVisible(false);
      setCreationStage('user');
      setCreatedUserId(null);
      setCreatedEmployeeId(null);
      userForm.resetFields();
      employeeForm.resetFields();
      setAddEmployeeTab('1');
    }
  };

  // Finish and navigate to employee details
  const handleFinishAddEmployee = () => {
    setAddModalVisible(false);
    setCreationStage('user');
    setCreatedUserId(null);
    setCreatedEmployeeId(null);
    userForm.resetFields();
    employeeForm.resetFields();
    setAddEmployeeTab('1');
    fetchEmployees(); // Refresh list
    if (createdEmployeeId) {
      navigate(`/hr/employees/${createdEmployeeId}`);
    }
  };

  // Load bank details, contacts, docs when employee is created
  useEffect(() => {
    if (createdEmployeeId) {
      // Load existing data for tabs 4-7
      (async () => {
        try {
          const [bankDetails, contacts, docs] = await Promise.all([
            employeeApiService.bankDetails.list(createdEmployeeId),
            employeeApiService.emergencyContacts.list(createdEmployeeId),
            employeeApiService.documents.list(createdEmployeeId),
          ]);
          setTempBankDetails(bankDetails);
          setTempEmergencyContacts(contacts);
          setTempDocuments(docs);
        } catch (err) {
          console.error('Failed to load employee data:', err);
        }
      })();
    }
  }, [createdEmployeeId]);

  // Render employee status tag
  const renderStatusTag = (status: EmploymentStatus) => {
    const statusConfig = {
      permanent: { color: 'success', label: 'Permanent' },
      contract: { color: 'processing', label: 'Contract' },
      probation: { color: 'warning', label: 'Probation' },
      intern: { color: 'default', label: 'Intern' },
      terminated: { color: 'error', label: 'Terminated' },
      resigned: { color: 'default', label: 'Resigned' },
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  // Render role tag
  const renderRoleTag = (role: UserRole) => {
    const roleConfig = {
      employee: { color: 'default', label: 'Employee' },
      manager: { color: 'blue', label: 'Manager' },
      hr_manager: { color: 'cyan', label: 'HR Manager' },
      finance_manager: { color: 'green', label: 'Finance Manager' },
      ceo: { color: 'purple', label: 'CEO' },
      admin: { color: 'red', label: 'Admin' },
    };

    const config = roleConfig[role] || { color: 'default', label: role };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  // Loading state
  if (loading && employees.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading employees..." />
      </div>
    );
  }

  // Error state
  if (error && employees.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Failed to Load Employees"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchEmployees}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${total} employee${total !== 1 ? 's' : ''} total`}
        breadcrumbs={[
          { title: 'Human Resources' },
          { title: 'Employees' },
        ]}
        actions={
          <>
            <Button
              icon={<DownloadOutlined />}
              style={{ borderRadius: '8px' }}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                border: 'none',
              }}
            >
              Add Employee
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card style={{ marginBottom: '20px', borderRadius: '12px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={8}>
            <Input
              placeholder="Search by name, email, employee number..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Department"
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              style={{ width: '100%' }}
              allowClear
              loading={departmentsLoading}
            >
              {departments.map(dept => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Role"
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="employee">Employee</Select.Option>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="hr_manager">HR Manager</Select.Option>
              <Select.Option value="finance_manager">Finance Manager</Select.Option>
              <Select.Option value="ceo">CEO</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="permanent">Permanent</Select.Option>
              <Select.Option value="contract">Contract</Select.Option>
              <Select.Option value="probation">Probation</Select.Option>
              <Select.Option value="intern">Intern</Select.Option>
              <Select.Option value="terminated">Terminated</Select.Option>
              <Select.Option value="resigned">Resigned</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Active Status"
              value={isActiveFilter}
              onChange={setIsActiveFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Col>
          {(searchTerm || selectedDepartment || selectedRole || selectedStatus || isActiveFilter !== true) && (
            <Col xs={24} sm={24} md={24}>
              <Button onClick={handleReset} icon={<FilterOutlined />}>
                Reset Filters
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Employee Grid */}
      <Row gutter={[20, 20]}>
        {employees.map((employee: EmployeeListItem) => (
          <Col key={employee.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => navigate(`/hr/employees/${employee.id}`)}
              style={{ borderRadius: '12px', height: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  {employee.avatar ? (
                    <img
                      src={employee.avatar}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00d084 0%, #00BFA5 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        fontSize: '32px',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <Title level={5} style={{ margin: 0 }}>
                    {employee.first_name} {employee.last_name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {employee.employee_number}
                  </Text>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <Text strong>{employee.designation_title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {employee.department_name}
                  </Text>
                </div>

                <div style={{ textAlign: 'center' }}>
                  {renderRoleTag(employee.role)}
                  {renderStatusTag(employee.employment_status)}
                </div>

                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  <div>{employee.user_email}</div>
                  {employee.phone && <div>{employee.phone}</div>}
                </div>

                {employee.manager_name && (
                  <div style={{ fontSize: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                    <UserOutlined /> Reports to: {employee.manager_name}
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Empty State */}
      {employees.length === 0 && !loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            marginTop: '20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ color: '#32373c', marginBottom: '8px' }}>No employees found</h3>
          <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
            {searchTerm || selectedDepartment || selectedRole || selectedStatus
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first employee'
            }
          </p>
          <Button
            type="primary"
            onClick={searchTerm || selectedDepartment || selectedRole || selectedStatus ? handleReset : () => setAddModalVisible(true)}
          >
            {searchTerm || selectedDepartment || selectedRole || selectedStatus ? 'Clear Filters' : 'Add Employee'}
          </Button>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} employees`}
            pageSizeOptions={['10', '20', '50', '100']}
          />
        </div>
      )}

      {/* Add Employee Modal - Two-Stage Process */}
      <Modal
        title={creationStage === 'user' ? 'Step 1: Create User Account' : 'Step 2: Complete Employee Profile'}
        open={addModalVisible}
        onCancel={handleCancelAddModal}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {creationStage === 'user' ? (
          // ===== STAGE 1: USER CREATION =====
          <div>
            <Alert
              title="Create User Account First"
              description="Every employee must have a system user account (for login). First, create the user account with an email and password."
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Form
              form={userForm}
              layout="vertical"
              onFinish={handleCreateUser}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="employee@ewesacco.org" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 8, message: 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password placeholder="Secure password (min 8 characters)" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="password_confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Re-enter password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large">
                  Create User & Continue
                </Button>
              </Form.Item>
            </Form>
          </div>
        ) : (
          // ===== STAGE 2: EMPLOYEE PROFILE (7 TABS) =====
          <div>
            <Alert
              title={`User Created: ${createdUserId}`}
              description={createdEmployeeId ?
                'Employee profile created! You can now add bank details, contacts, documents, and salary information.' :
                'Now complete the employee profile with personal info, employment details, and ID documents.'
              }
              type="success"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Tabs activeKey={addEmployeeTab} onChange={setAddEmployeeTab}>
              {/* TAB 1: PERSONAL INFO */}
              <Tabs.TabPane tab="Personal Info" key="1">
                <Form form={employeeForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="First Name" name="first_name" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Middle Name" name="middle_name">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Last Name" name="last_name" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Gender" name="gender">
                        <Select>
                          <Select.Option value="male">Male</Select.Option>
                          <Select.Option value="female">Female</Select.Option>
                          <Select.Option value="other">Other</Select.Option>
                          <Select.Option value="prefer_not_to_say">Prefer not to say</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Date of Birth" name="date_of_birth">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Nationality" name="nationality">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Marital Status" name="marital_status">
                        <Select>
                          <Select.Option value="single">Single</Select.Option>
                          <Select.Option value="married">Married</Select.Option>
                          <Select.Option value="divorced">Divorced</Select.Option>
                          <Select.Option value="widowed">Widowed</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Religion" name="religion">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Blood Group" name="blood_group">
                        <Select>
                          <Select.Option value="A+">A+</Select.Option>
                          <Select.Option value="A-">A-</Select.Option>
                          <Select.Option value="B+">B+</Select.Option>
                          <Select.Option value="B-">B-</Select.Option>
                          <Select.Option value="AB+">AB+</Select.Option>
                          <Select.Option value="AB-">AB-</Select.Option>
                          <Select.Option value="O+">O+</Select.Option>
                          <Select.Option value="O-">O-</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Number of Children" name="number_of_children">
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Spouse Employed" name="spouse_employed" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Phone" name="phone">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Personal Email" name="personal_email">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Address" name="address">
                    <Input.TextArea rows={2} />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="City" name="city">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="State/Province" name="state">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Postal Code" name="postal_code">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Country" name="country" initialValue="Zimbabwe">
                    <Input />
                  </Form.Item>

                  <Form.Item label="Bio" name="bio">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Form>
              </Tabs.TabPane>

              {/* TAB 2: EMPLOYMENT */}
              <Tabs.TabPane tab="Employment" key="2">
                <Form form={employeeForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Department" name="department" rules={[{ required: true }]}>
                        <Select
                          placeholder="Select department"
                          loading={departmentsLoading}
                          showSearch
                          onChange={handleDepartmentChange}
                        >
                          {departments.map(dept => (
                            <Select.Option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Designation" name="designation" rules={[{ required: true }]}>
                        <Select placeholder="Select designation" loading={designationsLoading} showSearch>
                          {filteredDesignations.map(desig => (
                            <Select.Option key={desig.id} value={desig.id}>
                              {desig.title}
                              {desig.level && ` - ${desig.level}`}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Employment Status" name="employment_status" rules={[{ required: true }]} initialValue="permanent">
                        <Select>
                          <Select.Option value="permanent">Permanent</Select.Option>
                          <Select.Option value="contract">Contract</Select.Option>
                          <Select.Option value="probation">Probation</Select.Option>
                          <Select.Option value="intern">Intern</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="System Role" name="role" rules={[{ required: true }]} initialValue="employee">
                        <Select>
                          <Select.Option value="employee">Employee</Select.Option>
                          <Select.Option value="manager">Manager</Select.Option>
                          <Select.Option value="hr_manager">HR Manager</Select.Option>
                          <Select.Option value="finance_manager">Finance Manager</Select.Option>
                          <Select.Option value="admin">Admin</Select.Option>
                          <Select.Option value="ceo">CEO</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Join Date" name="join_date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Confirmation Date" name="confirmation_date">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Probation End Date" name="probation_end_date">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Reports To" name="reports_to">
                        <Select placeholder="Select manager (optional)" allowClear showSearch loading={loading}>
                          {employees
                            .filter((emp) => ['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin'].includes(emp.role))
                            .map((emp) => (
                              <Select.Option key={emp.id} value={emp.id}>
                                {emp.first_name} {emp.last_name} - {emp.designation_title}
                              </Select.Option>
                            ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Contract Start Date" name="contract_start_date">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Contract End Date" name="contract_end_date">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Active Status" name="is_active" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Form>
              </Tabs.TabPane>

              {/* TAB 3: ID DOCUMENTS */}
              <Tabs.TabPane tab="ID Documents" key="3">
                <Form form={employeeForm} layout="vertical">
                  <Form.Item label="National ID" name="national_id">
                    <Input />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Passport Number" name="passport_number">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Passport Expiry Date" name="passport_expiry_date">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Work Permit Number" name="work_permit_number">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Work Permit Expiry Date" name="work_permit_expiry_date">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Tabs.TabPane>

              {/* TAB 4: BANK DETAILS */}
              <Tabs.TabPane tab="Bank Details" key="4">
                <Alert
                  title="Bank Accounts"
                  description={createdEmployeeId ? "Add bank account details for the employee." : "Bank details will be saved when you create the employee profile."}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Button type="primary" onClick={() => setAddBankVisible(true)} style={{ marginBottom: 16 }}>
                  Add Bank Account
                </Button>

                    <Table
                      dataSource={tempBankDetails}
                      rowKey="id"
                      size="small"
                      columns={[
                        { title: 'Bank', dataIndex: 'bank_name', key: 'bank_name' },
                        { title: 'Account Number', dataIndex: 'account_number', key: 'account_number' },
                        { title: 'Account Holder', dataIndex: 'account_holder_name', key: 'account_holder_name' },
                        { title: 'Type', dataIndex: 'account_type', key: 'account_type' },
                        {
                          title: 'Primary',
                          dataIndex: 'is_primary',
                          key: 'is_primary',
                          render: (val: boolean) => (val ? <CheckOutlined style={{ color: 'green' }} /> : null)
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
                          render: (_: any, record: EmployeeBankDetails) => (
                            <Space>
                              <Button size="small" icon={<EditOutlined />} onClick={() => openEditBank(record)} />
                              <Popconfirm title="Delete this bank account?" onConfirm={() => handleDeleteBank(record.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />

                    <Modal
                      title={editBankId ? "Edit Bank Account" : "Add Bank Account"}
                      open={addBankVisible}
                      onCancel={() => { setAddBankVisible(false); setEditBankId(null); bankForm.resetFields(); }}
                      onOk={() => bankForm.submit()}
                      width={600}
                    >
                      <Form form={bankForm} layout="vertical" onFinish={editBankId ? handleUpdateBank : handleAddBank}>
                        <Form.Item label="Bank Name" name="bank_name" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Branch" name="branch">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Branch Code" name="branch_code">
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="Account Number" name="account_number" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="Account Holder Name" name="account_holder_name" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="SWIFT Code" name="swift_code">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="IBAN" name="iban">
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="Account Type" name="account_type">
                          <Select>
                            <Select.Option value="savings">Savings</Select.Option>
                            <Select.Option value="current">Current</Select.Option>
                            <Select.Option value="salary">Salary</Select.Option>
                          </Select>
                        </Form.Item>
                        <Form.Item label="Primary Account" name="is_primary" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                        <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue={true}>
                          <Switch />
                        </Form.Item>
                      </Form>
                    </Modal>
              </Tabs.TabPane>

              {/* TAB 5: EMERGENCY CONTACTS */}
              <Tabs.TabPane tab="Emergency Contacts" key="5">
                <Alert
                  title="Emergency Contacts"
                  description={createdEmployeeId ? "Add emergency contact information." : "Contacts will be saved when you create the employee profile."}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Button type="primary" onClick={() => setAddContactVisible(true)} style={{ marginBottom: 16 }}>
                  Add Emergency Contact
                </Button>

                    <Table
                      dataSource={tempEmergencyContacts}
                      rowKey="id"
                      size="small"
                      columns={[
                        { title: 'Name', dataIndex: 'name', key: 'name' },
                        { title: 'Relationship', dataIndex: 'relationship', key: 'relationship' },
                        { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                        { title: 'Email', dataIndex: 'email', key: 'email' },
                        {
                          title: 'Primary',
                          dataIndex: 'is_primary',
                          key: 'is_primary',
                          render: (val: boolean) => (val ? <CheckOutlined style={{ color: 'green' }} /> : null)
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
                          render: (_: any, record: EmployeeEmergencyContact) => (
                            <Space>
                              <Button size="small" icon={<EditOutlined />} onClick={() => openEditContact(record)} />
                              <Popconfirm title="Delete this contact?" onConfirm={() => handleDeleteContact(record.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />

                    <Modal
                      title={editContactId ? "Edit Emergency Contact" : "Add Emergency Contact"}
                      open={addContactVisible}
                      onCancel={() => { setAddContactVisible(false); setEditContactId(null); contactForm.resetFields(); }}
                      onOk={() => contactForm.submit()}
                      width={600}
                    >
                      <Form form={contactForm} layout="vertical" onFinish={editContactId ? handleUpdateContact : handleAddContact}>
                        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="Relationship" name="relationship" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Alternate Phone" name="alternate_phone">
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="Email" name="email">
                          <Input />
                        </Form.Item>
                        <Form.Item label="Address" name="address">
                          <Input.TextArea rows={2} />
                        </Form.Item>
                        <Form.Item label="Primary Contact" name="is_primary" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Form>
                    </Modal>
              </Tabs.TabPane>

              {/* TAB 6: DOCUMENTS */}
              <Tabs.TabPane tab="Documents" key="6">
                <Alert
                  title="Employee Documents"
                  description={createdEmployeeId ? "Upload employee documents." : "Documents can be uploaded after creating the employee profile."}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {createdEmployeeId && (
                  <>
                    <Button type="primary" onClick={() => setUploadDocVisible(true)} style={{ marginBottom: 16 }}>
                      Upload Document
                    </Button>

                    <Table
                      dataSource={tempDocuments}
                      rowKey="id"
                      size="small"
                      columns={[
                        { title: 'Title', dataIndex: 'title', key: 'title' },
                        { title: 'Type', dataIndex: 'document_type', key: 'document_type' },
                        { title: 'File', dataIndex: 'file_name', key: 'file_name' },
                        {
                          title: 'Actions',
                          key: 'actions',
                          render: (_: any, record: EmployeeDocument) => (
                            <Popconfirm title="Delete this document?" onConfirm={() => handleDeleteDocument(record.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          ),
                        },
                      ]}
                    />

                    <Modal
                      title="Upload Document"
                      open={uploadDocVisible}
                      onCancel={() => { setUploadDocVisible(false); docForm.resetFields(); setUploadFileList([]); }}
                      onOk={() => docForm.submit()}
                      width={600}
                    >
                      <Form form={docForm} layout="vertical" onFinish={handleUploadDocument}>
                        <Form.Item label="Document Type" name="document_type" rules={[{ required: true }]}>
                          <Select>
                            <Select.Option value="resume">Resume/CV</Select.Option>
                            <Select.Option value="id_document">ID Document</Select.Option>
                            <Select.Option value="certificate">Certificate</Select.Option>
                            <Select.Option value="contract">Contract</Select.Option>
                            <Select.Option value="other">Other</Select.Option>
                          </Select>
                        </Form.Item>
                        <Form.Item label="Title" name="title">
                          <Input />
                        </Form.Item>
                        <Form.Item label="Notes" name="notes">
                          <Input.TextArea rows={2} />
                        </Form.Item>
                        <Form.Item label="Expiry Date" name="expiry_date">
                          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                        <Form.Item label="File" required>
                          <Upload
                            fileList={uploadFileList}
                            onChange={({ fileList }) => setUploadFileList(fileList)}
                            beforeUpload={() => false}
                            maxCount={1}
                          >
                            <Button icon={<UploadOutlined />}>Select File</Button>
                          </Upload>
                        </Form.Item>
                      </Form>
                    </Modal>
                  </>
                )}
              </Tabs.TabPane>

              {/* TAB 7: SALARY */}
              <Tabs.TabPane tab="Salary" key="7">
                <Alert
                  title="Salary Information"
                  description={createdEmployeeId ? "Add salary details for the employee." : "Salary information can be added after creating the employee profile."}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {createdEmployeeId && (
                  <>
                    <Button type="primary" onClick={() => setAddSalaryVisible(true)} style={{ marginBottom: 16 }}>
                      Add Salary Record
                    </Button>

                    <Modal
                      title="Add Salary Record"
                      open={addSalaryVisible}
                      onCancel={() => { setAddSalaryVisible(false); salaryForm.resetFields(); }}
                      onOk={() => salaryForm.submit()}
                      width={700}
                    >
                      <Form form={salaryForm} layout="vertical" onFinish={handleAddSalary}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Basic Salary" name="basic_salary" rules={[{ required: true }]}>
                              <InputNumber style={{ width: '100%' }} min={0} prefix="ZWG" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Currency" name="currency" initialValue="ZWG">
                              <Input disabled />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Payment Frequency" name="payment_frequency" initialValue="monthly">
                              <Select>
                                <Select.Option value="monthly">Monthly</Select.Option>
                                <Select.Option value="weekly">Weekly</Select.Option>
                                <Select.Option value="biweekly">Bi-weekly</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Effective From" name="effective_from" rules={[{ required: true }]}>
                              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Divider>Allowances</Divider>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Housing Allowance" name="housing_allowance">
                              <InputNumber style={{ width: '100%' }} min={0} prefix="ZWG" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Transport Allowance" name="transport_allowance">
                              <InputNumber style={{ width: '100%' }} min={0} prefix="ZWG" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Medical Allowance" name="medical_allowance">
                              <InputNumber style={{ width: '100%' }} min={0} prefix="ZWG" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Other Allowances" name="other_allowances">
                              <InputNumber style={{ width: '100%' }} min={0} prefix="ZWG" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="Notes" name="notes">
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Form>
                    </Modal>
                  </>
                )}
              </Tabs.TabPane>
            </Tabs>

            <div style={{ marginTop: 20, textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Space>
                <Button onClick={() => setCreationStage('user')}>Back to User Creation</Button>
                {!createdEmployeeId && (
                  <Button type="primary" size="large" onClick={handleCreateEmployee}>
                    Create Employee Profile
                  </Button>
                )}
                {createdEmployeeId && (
                  <Button type="primary" size="large" onClick={handleFinishAddEmployee}>
                    Finish & View Employee
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
