/**
 * Employee Details Page - Direct API Integration
 * Comprehensive edit form with tabs for all employee data
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Button,
  Card,
  Tabs,
  Avatar,
  Space,
  Tag,
  Typography,
  Spin,
  Alert,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Switch,
  InputNumber,
  Divider,
  Table,
  Popconfirm,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  FileTextOutlined,
  UploadOutlined,
  PlusOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import employeeApiService from '../../services/api/employeeApi';
import type {
  EmployeeDetail,
  EmployeeDocument,
  EmployeeBankDetails,
  EmployeeEmergencyContact,
  EmployeeSalary,
  Department,
  Designation,
  EmployeeDocumentCreate,
} from '../../types/employee';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;

export const EmployeeDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Local state
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<EmployeeBankDetails[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmployeeEmergencyContact[]>([]);
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalTab, setEditModalTab] = useState('1');
  const [form] = Form.useForm();

  // Bank Details CRUD state
  const [addBankVisible, setAddBankVisible] = useState(false);
  const [editBankId, setEditBankId] = useState<string | null>(null);
  const [bankForm] = Form.useForm();

  // Emergency Contact CRUD state
  const [addContactVisible, setAddContactVisible] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [contactForm] = Form.useForm();

  // Document CRUD state
  const [uploadDocVisible, setUploadDocVisible] = useState(false);
  const [editDocId, setEditDocId] = useState<string | null>(null);
  const [docForm] = Form.useForm();
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);

  // Salary CRUD state
  const [addSalaryVisible, setAddSalaryVisible] = useState(false);
  const [salaryForm] = Form.useForm();

  // Fetch employee data
  const fetchEmployee = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const data = await employeeApiService.employees.get(id);
      setEmployee(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load employee details';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch related data
  const fetchDocuments = async () => {
    if (!id) return;
    setDocumentsLoading(true);
    try {
      const response = await employeeApiService.documents.list({ employee: id });
      setDocuments(response.results);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    if (!id) return;
    try {
      const response = await employeeApiService.bankDetails.list({ employee: id });
      setBankDetails(response.results);
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
    }
  };

  const fetchEmergencyContacts = async () => {
    if (!id) return;
    try {
      const response = await employeeApiService.emergencyContacts.list({ employee: id });
      setEmergencyContacts(response.results);
    } catch (err) {
      console.error('Failed to fetch emergency contacts:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await employeeApiService.departments.list({ page_size: 1000 });
      setDepartments(response.results);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await employeeApiService.designations.list({ page_size: 1000 });
      setDesignations(response.results);
    } catch (err) {
      console.error('Failed to fetch designations:', err);
    }
  };

  const fetchSalaries = async () => {
    if (!id) return;
    try {
      const response = await employeeApiService.salaries.list({ employee: id, ordering: '-effective_from' });
      setSalaries(response.results);
    } catch (err) {
      console.error('Failed to fetch salaries:', err);
    }
  };

  // Load all data on mount
  useEffect(() => {
    fetchEmployee();
    fetchDocuments();
    fetchBankDetails();
    fetchEmergencyContacts();
    fetchSalaries();
    fetchDepartments();
    fetchDesignations();

    return () => {
      setEmployee(null);
      setError(null);
    };
  }, [id]);

  // Handle update employee
  const handleUpdateEmployee = async (values: any) => {
    if (!id) return;

    try {
      // Format dates
      const updateData: any = { ...values };

      if (values.date_of_birth) {
        updateData.date_of_birth = dayjs(values.date_of_birth).format('YYYY-MM-DD');
      }
      if (values.join_date) {
        updateData.join_date = dayjs(values.join_date).format('YYYY-MM-DD');
      }
      if (values.confirmation_date) {
        updateData.confirmation_date = dayjs(values.confirmation_date).format('YYYY-MM-DD');
      }
      if (values.probation_end_date) {
        updateData.probation_end_date = dayjs(values.probation_end_date).format('YYYY-MM-DD');
      }
      if (values.contract_start_date) {
        updateData.contract_start_date = dayjs(values.contract_start_date).format('YYYY-MM-DD');
      }
      if (values.contract_end_date) {
        updateData.contract_end_date = dayjs(values.contract_end_date).format('YYYY-MM-DD');
      }
      if (values.passport_expiry_date) {
        updateData.passport_expiry_date = dayjs(values.passport_expiry_date).format('YYYY-MM-DD');
      }
      if (values.work_permit_expiry_date) {
        updateData.work_permit_expiry_date = dayjs(values.work_permit_expiry_date).format('YYYY-MM-DD');
      }

      const updated = await employeeApiService.employees.partialUpdate(id, updateData);
      setEmployee(updated);
      setEditModalVisible(false);
      form.resetFields();
      message.success('Employee updated successfully');
    } catch (err: any) {
      console.error('Failed to update employee:', err);
      const fieldErrors = err.response?.data;

      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            message.error(`${field}: ${errors.join(', ')}`);
          }
        });
      } else {
        message.error('Failed to update employee');
      }
    }
  };

  // Handle delete
  const handleDeleteEmployee = () => {
    if (!id) return;

    Modal.confirm({
      title: 'Delete Employee',
      content: 'Are you sure you want to delete this employee? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await employeeApiService.employees.delete(id);
          message.success('Employee deleted successfully');
          navigate('/hr/employees');
        } catch (err) {
          message.error('Failed to delete employee');
        }
      },
    });
  };

  // Open edit modal
  const openEditModal = () => {
    if (!employee) return;

    form.setFieldsValue({
      // Personal Info
      first_name: employee.first_name,
      middle_name: employee.middle_name,
      last_name: employee.last_name,
      gender: employee.gender,
      date_of_birth: employee.date_of_birth ? dayjs(employee.date_of_birth) : null,
      nationality: employee.nationality,
      marital_status: employee.marital_status,
      religion: employee.religion,
      blood_group: employee.blood_group,
      number_of_children: employee.number_of_children,
      spouse_employed: employee.spouse_employed,

      // Contact Info
      phone: employee.phone,
      personal_email: employee.personal_email,
      address: employee.address,
      city: employee.city,
      state: employee.state,
      postal_code: employee.postal_code,
      country: employee.country,

      // Employment Info
      department: employee.department,
      designation: employee.designation,
      role: employee.role,
      reports_to: employee.reports_to,
      employment_status: employee.employment_status,
      join_date: employee.join_date ? dayjs(employee.join_date) : null,
      confirmation_date: employee.confirmation_date ? dayjs(employee.confirmation_date) : null,
      probation_end_date: employee.probation_end_date ? dayjs(employee.probation_end_date) : null,
      contract_start_date: employee.contract_start_date ? dayjs(employee.contract_start_date) : null,
      contract_end_date: employee.contract_end_date ? dayjs(employee.contract_end_date) : null,

      // Documents
      national_id: employee.national_id,
      passport_number: employee.passport_number,
      passport_expiry_date: employee.passport_expiry_date ? dayjs(employee.passport_expiry_date) : null,
      work_permit_number: employee.work_permit_number,
      work_permit_expiry_date: employee.work_permit_expiry_date ? dayjs(employee.work_permit_expiry_date) : null,

      // Profile
      bio: employee.bio,
      is_active: employee.is_active,
    });

    setEditModalVisible(true);
    setEditModalTab('1');
  };

  // ============================================================================
  // BANK DETAILS CRUD HANDLERS
  // ============================================================================

  const handleAddBank = async (values: any) => {
    if (!id) return;
    try {
      await employeeApiService.bankDetails.create({ ...values, employee: id });
      message.success('Bank account added successfully');
      bankForm.resetFields();
      setAddBankVisible(false);
      fetchBankDetails();
    } catch (err: any) {
      const fieldErrors = err.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            message.error(`${field}: ${errors.join(', ')}`);
          }
        });
      } else {
        message.error('Failed to add bank account');
      }
    }
  };

  const handleUpdateBank = async (values: any) => {
    if (!editBankId) return;
    try {
      await employeeApiService.bankDetails.partialUpdate(editBankId, values);
      message.success('Bank account updated successfully');
      bankForm.resetFields();
      setEditBankId(null);
      fetchBankDetails();
    } catch (err: any) {
      message.error('Failed to update bank account');
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    try {
      await employeeApiService.bankDetails.delete(bankId);
      message.success('Bank account deleted successfully');
      fetchBankDetails();
    } catch (err) {
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
  };

  // ============================================================================
  // EMERGENCY CONTACT CRUD HANDLERS
  // ============================================================================

  const handleAddContact = async (values: any) => {
    if (!id) return;
    try {
      await employeeApiService.emergencyContacts.create({ ...values, employee: id });
      message.success('Emergency contact added successfully');
      contactForm.resetFields();
      setAddContactVisible(false);
      fetchEmergencyContacts();
    } catch (err: any) {
      const fieldErrors = err.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            message.error(`${field}: ${errors.join(', ')}`);
          }
        });
      } else {
        message.error('Failed to add emergency contact');
      }
    }
  };

  const handleUpdateContact = async (values: any) => {
    if (!editContactId) return;
    try {
      await employeeApiService.emergencyContacts.partialUpdate(editContactId, values);
      message.success('Emergency contact updated successfully');
      contactForm.resetFields();
      setEditContactId(null);
      fetchEmergencyContacts();
    } catch (err: any) {
      message.error('Failed to update emergency contact');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await employeeApiService.emergencyContacts.delete(contactId);
      message.success('Emergency contact deleted successfully');
      fetchEmergencyContacts();
    } catch (err) {
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
  };

  // ============================================================================
  // DOCUMENT CRUD HANDLERS
  // ============================================================================

  const handleUploadDocument = async (values: any) => {
    if (!id || uploadFileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    try {
      const file = uploadFileList[0].originFileObj as File;
      const docData: EmployeeDocumentCreate = {
        employee: id,
        document_type: values.document_type,
        file: file,
        title: values.title,
        notes: values.notes,
        expiry_date: values.expiry_date ? dayjs(values.expiry_date).format('YYYY-MM-DD') : undefined,
      };

      await employeeApiService.documents.create(docData);
      message.success('Document uploaded successfully');
      docForm.resetFields();
      setUploadFileList([]);
      setUploadDocVisible(false);
      fetchDocuments();
    } catch (err: any) {
      const fieldErrors = err.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            message.error(`${field}: ${errors.join(', ')}`);
          }
        });
      } else {
        message.error('Failed to upload document');
      }
    }
  };

  const handleUpdateDocument = async (docId: string, title: string) => {
    try {
      await employeeApiService.documents.update(docId, { title });
      message.success('Document title updated successfully');
      fetchDocuments();
    } catch (err) {
      message.error('Failed to update document');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await employeeApiService.documents.delete(docId);
      message.success('Document deleted successfully');
      fetchDocuments();
    } catch (err) {
      message.error('Failed to delete document');
    }
  };

  // ============================================================================
  // SALARY CRUD HANDLERS
  // ============================================================================

  const handleAddSalary = async (values: any) => {
    if (!id) return;
    try {
      const salaryData = {
        ...values,
        employee: id,
        effective_from: values.effective_from ? dayjs(values.effective_from).format('YYYY-MM-DD') : undefined,
        effective_to: values.effective_to ? dayjs(values.effective_to).format('YYYY-MM-DD') : undefined,
      };

      await employeeApiService.salaries.create(salaryData);
      message.success('Salary record added successfully');
      salaryForm.resetFields();
      setAddSalaryVisible(false);
      fetchSalaries();
      fetchEmployee(); // Refresh to update current_salary
    } catch (err: any) {
      const fieldErrors = err.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            message.error(`${field}: ${errors.join(', ')}`);
          }
        });
      } else {
        message.error('Failed to add salary record');
      }
    }
  };

  // Loading state
  if (loading && !employee) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading employee details..." />
      </div>
    );
  }

  // Error state
  if (error && !employee) {
    return (
      <div style={{ padding: '40px' }}>
        <Alert
          message="Failed to Load Employee"
          description={error}
          type="error"
          showIcon
          action={<Button onClick={fetchEmployee}>Retry</Button>}
        />
        <Button onClick={() => navigate('/hr/employees')} type="primary" style={{ marginTop: '16px' }}>
          Back to Employees
        </Button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Title level={3}>Employee not found</Title>
        <Button onClick={() => navigate('/hr/employees')} type="primary">Back to Employees</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header Card */}
      <Card style={{ marginBottom: '20px', borderRadius: '12px' }}>
        <Row align="middle" gutter={24}>
          <Col>
            {employee.avatar ? (
              <Avatar size={100} src={employee.avatar} />
            ) : (
              <Avatar size={100} style={{ background: '#00d084', fontSize: '40px' }}>
                {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
              </Avatar>
            )}
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0 }}>
              {employee.first_name} {employee.middle_name} {employee.last_name}
            </Title>
            <Space size="large" style={{ marginTop: '8px' }}>
              <Text type="secondary">{employee.designation_details?.title}</Text>
              <Text type="secondary">{employee.department_details?.name}</Text>
              <Tag color={employee.is_active ? 'success' : 'default'}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </Tag>
              <Tag>{employee.employment_status}</Tag>
            </Space>
            <div style={{ marginTop: '12px' }}>
              <Space>
                <MailOutlined /> {employee.user_details?.email}
              </Space>
              {employee.phone && (
                <Space style={{ marginLeft: '16px' }}>
                  <PhoneOutlined /> {employee.phone}
                </Space>
              )}
            </div>
          </Col>
          <Col>
            <Space>
              <Button icon={<EditOutlined />} onClick={openEditModal}>Edit</Button>
              <Button icon={<DeleteOutlined />} danger onClick={handleDeleteEmployee}>Delete</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* View Tabs */}
      <Card style={{ borderRadius: '12px' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="Profile" key="profile">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card title="Personal Information" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><Text strong>Employee Number:</Text> {employee.employee_number}</div>
                    <div><Text strong>Gender:</Text> {employee.gender || 'Not specified'}</div>
                    <div><Text strong>Date of Birth:</Text> {employee.date_of_birth || 'Not specified'}</div>
                    <div><Text strong>Nationality:</Text> {employee.nationality || 'Not specified'}</div>
                    <div><Text strong>Religion:</Text> {employee.religion || 'Not specified'}</div>
                    <div><Text strong>Marital Status:</Text> {employee.marital_status || 'Not specified'}</div>
                    <div><Text strong>Blood Group:</Text> {employee.blood_group || 'Not specified'}</div>
                    <div><Text strong>Children:</Text> {employee.number_of_children || 0}</div>
                    <div><Text strong>Spouse Employed:</Text> {employee.spouse_employed ? 'Yes' : 'No'}</div>
                  </Space>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Contact Information" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><Text strong>Work Email:</Text> {employee.user_details?.email}</div>
                    <div><Text strong>Personal Email:</Text> {employee.personal_email || 'Not provided'}</div>
                    <div><Text strong>Phone:</Text> {employee.phone || 'Not provided'}</div>
                    <div><Text strong>Address:</Text> {employee.address || 'Not provided'}</div>
                    <div><Text strong>City:</Text> {employee.city || 'Not provided'}</div>
                    <div><Text strong>State/Province:</Text> {employee.state || 'Not provided'}</div>
                    <div><Text strong>Postal Code:</Text> {employee.postal_code || 'Not provided'}</div>
                    <div><Text strong>Country:</Text> {employee.country}</div>
                  </Space>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="Employment Information" size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div><Text strong>Department:</Text> {employee.department_details?.name}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Designation:</Text> {employee.designation_details?.title}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Employment Status:</Text> {employee.employment_status}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>System Role:</Text> {employee.role}</div>
                    </Col>
                    <Col span={8}>
                      <div><Text strong>Join Date:</Text> {employee.join_date}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Confirmation Date:</Text> {employee.confirmation_date || 'N/A'}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Probation End:</Text> {employee.probation_end_date || 'N/A'}</div>
                    </Col>
                    <Col span={8}>
                      <div><Text strong>Reports To:</Text> {employee.manager_details ? `${employee.manager_details.first_name} ${employee.manager_details.last_name}` : 'N/A'}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Contract Start:</Text> {employee.contract_start_date || 'N/A'}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Contract End:</Text> {employee.contract_end_date || 'N/A'}</div>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {employee.bio && (
                <Col span={24}>
                  <Card title="Biography" size="small">
                    <Paragraph>{employee.bio}</Paragraph>
                  </Card>
                </Col>
              )}
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Bank Details" key="bank">
            <Spin spinning={false}>
              {bankDetails.map((bank) => (
                <Card key={bank.id} size="small" style={{ marginBottom: '16px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div><Text strong>Bank Name:</Text> {bank.bank_name}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Branch:</Text> {bank.branch || 'N/A'}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Account Type:</Text> {bank.account_type}</div>
                    </Col>
                    <Col span={12}>
                      <div><Text strong>Account Holder:</Text> {bank.account_holder_name}</div>
                      <div style={{ marginTop: '8px' }}><Text strong>Account Number:</Text> ****{bank.account_number.slice(-4)}</div>
                      {bank.is_primary && <Tag color="blue" style={{ marginTop: '8px' }}>Primary Account</Tag>}
                    </Col>
                  </Row>
                </Card>
              ))}
              {bankDetails.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text type="secondary">No bank details on file</Text>
                </div>
              )}
            </Spin>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Emergency Contacts" key="emergency">
            {emergencyContacts.map((contact) => (
              <Card key={contact.id} size="small" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div><Text strong>Name:</Text> {contact.name}</div>
                    <div style={{ marginTop: '8px' }}><Text strong>Relationship:</Text> {contact.relationship}</div>
                  </Col>
                  <Col span={12}>
                    <div><Text strong>Phone:</Text> {contact.phone}</div>
                    <div style={{ marginTop: '8px' }}><Text strong>Email:</Text> {contact.email || 'N/A'}</div>
                    {contact.is_primary && <Tag color="blue" style={{ marginTop: '8px' }}>Primary Contact</Tag>}
                  </Col>
                </Row>
              </Card>
            ))}
            {emergencyContacts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">No emergency contacts on file</Text>
              </div>
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="Documents" key="documents">
            <Spin spinning={documentsLoading}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {documents.map((doc) => (
                  <Card key={doc.id} size="small">
                    <Row align="middle" justify="space-between">
                      <Col>
                        <Space>
                          <FileTextOutlined />
                          <div>
                            <div><Text strong>{doc.document_type_display}</Text></div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {doc.file_name} ({(doc.file_size / 1024).toFixed(2)} KB)
                            </Text>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Space>
                          {doc.is_verified ? (
                            <Tag color="success">Verified</Tag>
                          ) : (
                            <Tag color="warning">Pending</Tag>
                          )}
                          <Button size="small" href={doc.file_url} target="_blank">Download</Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
                {documents.length === 0 && !documentsLoading && (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="secondary">No documents uploaded</Text>
                  </div>
                )}
              </Space>
            </Spin>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Salary" key="salary">
            {employee.current_salary ? (
              <Card>
                <Row gutter={16}>
                  <Col span={12}>
                    <div><Text strong>Basic Salary:</Text> {employee.current_salary.currency} {employee.current_salary.basic_salary.toLocaleString()}</div>
                    <div style={{ marginTop: '8px' }}><Text strong>Housing Allowance:</Text> {employee.current_salary.currency} {employee.current_salary.housing_allowance.toLocaleString()}</div>
                    <div style={{ marginTop: '8px' }}><Text strong>Transport Allowance:</Text> {employee.current_salary.currency} {employee.current_salary.transport_allowance.toLocaleString()}</div>
                    <div style={{ marginTop: '8px' }}><Text strong>Medical Allowance:</Text> {employee.current_salary.currency} {employee.current_salary.medical_allowance.toLocaleString()}</div>
                  </Col>
                  <Col span={12}>
                    <div><Text strong>Gross Salary:</Text> <Text style={{ fontSize: '20px', color: '#00d084' }}>{employee.current_salary.currency} {employee.current_salary.gross_salary.toLocaleString()}</Text></div>
                    <div style={{ marginTop: '8px' }}><Text strong>Payment Frequency:</Text> {employee.current_salary.payment_frequency}</div>
                    <div style={{ marginTop: '8px' }}><Text strong>Effective From:</Text> {employee.current_salary.effective_from}</div>
                  </Col>
                </Row>
              </Card>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">No salary information available</Text>
              </div>
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Edit Modal with Tabs */}
      <Modal
        title="Edit Employee"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        width={1000}
        okText="Save Changes"
        style={{ top: 20 }}
      >
        <Tabs activeKey={editModalTab} onChange={setEditModalTab}>
          {/* Tab 1: Personal Information */}
          <Tabs.TabPane tab="Personal Info" key="1">
            <Form form={form} layout="vertical" onFinish={handleUpdateEmployee}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="First Name" name="first_name">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Middle Name" name="middle_name">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Last Name" name="last_name">
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

              <Form.Item label="Country" name="country">
                <Input />
              </Form.Item>

              <Form.Item label="Bio" name="bio">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Form>
          </Tabs.TabPane>

          {/* Tab 2: Employment Information */}
          <Tabs.TabPane tab="Employment" key="2">
            <Form form={form} layout="vertical" onFinish={handleUpdateEmployee}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Department" name="department">
                    <Select showSearch optionFilterProp="children">
                      {departments.map(dept => (
                        <Select.Option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Designation" name="designation">
                    <Select showSearch optionFilterProp="children">
                      {designations.map(desig => (
                        <Select.Option key={desig.id} value={desig.id}>
                          {desig.title} {desig.level && `- ${desig.level}`}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Employment Status" name="employment_status">
                    <Select>
                      <Select.Option value="permanent">Permanent</Select.Option>
                      <Select.Option value="contract">Contract</Select.Option>
                      <Select.Option value="probation">Probation</Select.Option>
                      <Select.Option value="intern">Intern</Select.Option>
                      <Select.Option value="terminated">Terminated</Select.Option>
                      <Select.Option value="resigned">Resigned</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="System Role" name="role">
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
                  <Form.Item label="Join Date" name="join_date">
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
                    <Select allowClear showSearch optionFilterProp="children" placeholder="Select manager">
                      {/* You can fetch employees list here */}
                      <Select.Option value="">None</Select.Option>
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

              <Form.Item label="Active" name="is_active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Form>
          </Tabs.TabPane>

          {/* Tab 3: Identification Documents */}
          <Tabs.TabPane tab="ID Documents" key="3">
            <Form form={form} layout="vertical" onFinish={handleUpdateEmployee}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="National ID Number" name="national_id">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Passport Number" name="passport_number">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Passport Expiry Date" name="passport_expiry_date">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Work Permit Number" name="work_permit_number">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Work Permit Expiry Date" name="work_permit_expiry_date">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Tabs.TabPane>

          {/* Tab 4: Bank Details */}
          <Tabs.TabPane tab="Bank Details" key="4">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  bankForm.resetFields();
                  setAddBankVisible(true);
                  setEditBankId(null);
                }}
              >
                Add Bank Account
              </Button>

              <Table
                dataSource={bankDetails}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Bank Name',
                    dataIndex: 'bank_name',
                    key: 'bank_name',
                  },
                  {
                    title: 'Account Holder',
                    dataIndex: 'account_holder_name',
                    key: 'account_holder_name',
                  },
                  {
                    title: 'Account Number',
                    dataIndex: 'account_number',
                    key: 'account_number',
                    render: (acc: string) => `****${acc.slice(-4)}`,
                  },
                  {
                    title: 'Account Type',
                    dataIndex: 'account_type',
                    key: 'account_type',
                  },
                  {
                    title: 'Primary',
                    dataIndex: 'is_primary',
                    key: 'is_primary',
                    render: (isPrimary: boolean) =>
                      isPrimary ? <Tag color="blue">Primary</Tag> : null,
                  },
                  {
                    title: 'Status',
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (isActive: boolean) =>
                      isActive ? (
                        <Tag color="success">Active</Tag>
                      ) : (
                        <Tag color="default">Inactive</Tag>
                      ),
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_: any, record: EmployeeBankDetails) => (
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            openEditBank(record);
                            setAddBankVisible(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Delete bank account?"
                          description="Are you sure you want to delete this bank account?"
                          onConfirm={() => handleDeleteBank(record.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button size="small" danger icon={<DeleteOutlined />}>
                            Delete
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />

              {/* Bank Form Modal */}
              <Modal
                title={editBankId ? 'Edit Bank Account' : 'Add Bank Account'}
                open={addBankVisible}
                onCancel={() => {
                  setAddBankVisible(false);
                  setEditBankId(null);
                  bankForm.resetFields();
                }}
                onOk={() => bankForm.submit()}
                width={700}
              >
                <Form
                  form={bankForm}
                  layout="vertical"
                  onFinish={editBankId ? handleUpdateBank : handleAddBank}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Bank Name"
                        name="bank_name"
                        rules={[{ required: true, message: 'Please enter bank name' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Branch" name="branch">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Branch Code" name="branch_code">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Account Type"
                        name="account_type"
                        rules={[{ required: true, message: 'Please select account type' }]}
                      >
                        <Select>
                          <Select.Option value="savings">Savings</Select.Option>
                          <Select.Option value="current">Current</Select.Option>
                          <Select.Option value="checking">Checking</Select.Option>
                          <Select.Option value="salary">Salary</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Account Number"
                        name="account_number"
                        rules={[{ required: true, message: 'Please enter account number' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Account Holder Name"
                        name="account_holder_name"
                        rules={[{ required: true, message: 'Please enter account holder name' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

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

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Primary Account" name="is_primary" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue={true}>
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Modal>
            </Space>
          </Tabs.TabPane>

          {/* Tab 5: Emergency Contacts */}
          <Tabs.TabPane tab="Emergency Contacts" key="5">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  contactForm.resetFields();
                  setAddContactVisible(true);
                  setEditContactId(null);
                }}
              >
                Add Emergency Contact
              </Button>

              <Table
                dataSource={emergencyContacts}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Name',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Relationship',
                    dataIndex: 'relationship',
                    key: 'relationship',
                  },
                  {
                    title: 'Phone',
                    dataIndex: 'phone',
                    key: 'phone',
                  },
                  {
                    title: 'Email',
                    dataIndex: 'email',
                    key: 'email',
                    render: (email: string | null) => email || 'N/A',
                  },
                  {
                    title: 'Primary',
                    dataIndex: 'is_primary',
                    key: 'is_primary',
                    render: (isPrimary: boolean) =>
                      isPrimary ? <Tag color="blue">Primary</Tag> : null,
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_: any, record: EmployeeEmergencyContact) => (
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            openEditContact(record);
                            setAddContactVisible(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Delete emergency contact?"
                          description="Are you sure you want to delete this contact?"
                          onConfirm={() => handleDeleteContact(record.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button size="small" danger icon={<DeleteOutlined />}>
                            Delete
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />

              {/* Contact Form Modal */}
              <Modal
                title={editContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                open={addContactVisible}
                onCancel={() => {
                  setAddContactVisible(false);
                  setEditContactId(null);
                  contactForm.resetFields();
                }}
                onOk={() => contactForm.submit()}
                width={700}
              >
                <Form
                  form={contactForm}
                  layout="vertical"
                  onFinish={editContactId ? handleUpdateContact : handleAddContact}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: 'Please enter contact name' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Relationship"
                        name="relationship"
                        rules={[{ required: true, message: 'Please enter relationship' }]}
                      >
                        <Input placeholder="e.g., Spouse, Parent, Sibling" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Phone"
                        name="phone"
                        rules={[{ required: true, message: 'Please enter phone number' }]}
                      >
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
                    <Input type="email" />
                  </Form.Item>

                  <Form.Item label="Address" name="address">
                    <Input.TextArea rows={2} />
                  </Form.Item>

                  <Form.Item label="Primary Contact" name="is_primary" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Form>
              </Modal>
            </Space>
          </Tabs.TabPane>

          {/* Tab 6: Documents */}
          <Tabs.TabPane tab="Documents" key="6">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => {
                  docForm.resetFields();
                  setUploadFileList([]);
                  setUploadDocVisible(true);
                }}
              >
                Upload Document
              </Button>

              <Table
                dataSource={documents}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Document Type',
                    dataIndex: 'document_type_display',
                    key: 'document_type_display',
                  },
                  {
                    title: 'Title',
                    dataIndex: 'title',
                    key: 'title',
                    render: (title: string | null, record: EmployeeDocument) => (
                      <Input
                        size="small"
                        defaultValue={title || record.file_name}
                        onBlur={(e) => {
                          if (e.target.value !== title) {
                            handleUpdateDocument(record.id, e.target.value);
                          }
                        }}
                        placeholder="Enter document title"
                      />
                    ),
                  },
                  {
                    title: 'File Name',
                    dataIndex: 'file_name',
                    key: 'file_name',
                  },
                  {
                    title: 'Size',
                    dataIndex: 'file_size',
                    key: 'file_size',
                    render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
                  },
                  {
                    title: 'Verified',
                    dataIndex: 'is_verified',
                    key: 'is_verified',
                    render: (isVerified: boolean) =>
                      isVerified ? (
                        <Tag color="success" icon={<CheckOutlined />}>
                          Verified
                        </Tag>
                      ) : (
                        <Tag color="warning">Pending</Tag>
                      ),
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_: any, record: EmployeeDocument) => (
                      <Space>
                        <Button size="small" href={record.file_url} target="_blank">
                          Download
                        </Button>
                        <Popconfirm
                          title="Delete document?"
                          description="Are you sure you want to delete this document?"
                          onConfirm={() => handleDeleteDocument(record.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button size="small" danger icon={<DeleteOutlined />}>
                            Delete
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />

              {/* Document Upload Modal */}
              <Modal
                title="Upload Document"
                open={uploadDocVisible}
                onCancel={() => {
                  setUploadDocVisible(false);
                  docForm.resetFields();
                  setUploadFileList([]);
                }}
                onOk={() => docForm.submit()}
                width={600}
              >
                <Form form={docForm} layout="vertical" onFinish={handleUploadDocument}>
                  <Form.Item
                    label="Document Type"
                    name="document_type"
                    rules={[{ required: true, message: 'Please select document type' }]}
                  >
                    <Select>
                      <Select.Option value="national_id">National ID</Select.Option>
                      <Select.Option value="passport">Passport</Select.Option>
                      <Select.Option value="drivers_license">Driver's License</Select.Option>
                      <Select.Option value="birth_certificate">Birth Certificate</Select.Option>
                      <Select.Option value="education">Education Certificate</Select.Option>
                      <Select.Option value="professional">Professional Certificate</Select.Option>
                      <Select.Option value="contract">Employment Contract</Select.Option>
                      <Select.Option value="medical">Medical Certificate</Select.Option>
                      <Select.Option value="other">Other</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Document Title" name="title">
                    <Input placeholder="Give this document a descriptive name" />
                  </Form.Item>

                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea rows={2} placeholder="Optional notes about this document" />
                  </Form.Item>

                  <Form.Item label="Expiry Date (if applicable)" name="expiry_date">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>

                  <Form.Item
                    label="File"
                    required
                    help="Click or drag file to upload (max 10MB)"
                  >
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
            </Space>
          </Tabs.TabPane>

          {/* Tab 7: Salary */}
          <Tabs.TabPane tab="Salary" key="7">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  salaryForm.resetFields();
                  setAddSalaryVisible(true);
                }}
              >
                Add Salary Record
              </Button>

              <Table
                dataSource={salaries}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Effective From',
                    dataIndex: 'effective_from',
                    key: 'effective_from',
                  },
                  {
                    title: 'Effective To',
                    dataIndex: 'effective_to',
                    key: 'effective_to',
                    render: (date: string | null) => date || 'Current',
                  },
                  {
                    title: 'Basic Salary',
                    dataIndex: 'basic_salary',
                    key: 'basic_salary',
                    render: (amount: number, record: EmployeeSalary) =>
                      `${record.currency} ${amount.toLocaleString()}`,
                  },
                  {
                    title: 'Gross Salary',
                    dataIndex: 'gross_salary',
                    key: 'gross_salary',
                    render: (amount: number, record: EmployeeSalary) =>
                      `${record.currency} ${amount.toLocaleString()}`,
                  },
                  {
                    title: 'Frequency',
                    dataIndex: 'payment_frequency',
                    key: 'payment_frequency',
                  },
                  {
                    title: 'Status',
                    dataIndex: 'is_current',
                    key: 'is_current',
                    render: (isCurrent: boolean) =>
                      isCurrent ? <Tag color="success">Current</Tag> : <Tag>Historical</Tag>,
                  },
                ]}
              />

              {/* Salary Form Modal */}
              <Modal
                title="Add Salary Record"
                open={addSalaryVisible}
                onCancel={() => {
                  setAddSalaryVisible(false);
                  salaryForm.resetFields();
                }}
                onOk={() => salaryForm.submit()}
                width={800}
              >
                <Form form={salaryForm} layout="vertical" onFinish={handleAddSalary}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Basic Salary"
                        name="basic_salary"
                        rules={[{ required: true, message: 'Please enter basic salary' }]}
                      >
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Currency"
                        name="currency"
                        rules={[{ required: true, message: 'Please select currency' }]}
                        initialValue="ZWG"
                      >
                        <Select>
                          <Select.Option value="ZWG">ZWG (Zimbabwe Gold)</Select.Option>
                          <Select.Option value="USD">USD</Select.Option>
                          <Select.Option value="ZAR">ZAR</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Payment Frequency"
                        name="payment_frequency"
                        rules={[{ required: true, message: 'Please select payment frequency' }]}
                        initialValue="monthly"
                      >
                        <Select>
                          <Select.Option value="monthly">Monthly</Select.Option>
                          <Select.Option value="bi_weekly">Bi-Weekly</Select.Option>
                          <Select.Option value="weekly">Weekly</Select.Option>
                          <Select.Option value="daily">Daily</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Effective From"
                        name="effective_from"
                        rules={[{ required: true, message: 'Please select effective date' }]}
                      >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider>Allowances</Divider>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Housing Allowance" name="housing_allowance" initialValue={0}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Transport Allowance" name="transport_allowance" initialValue={0}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Medical Allowance" name="medical_allowance" initialValue={0}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Other Allowances" name="other_allowances" initialValue={0}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea rows={2} />
                  </Form.Item>

                  <Form.Item label="Effective To (leave blank for current)" name="effective_to">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Form>
              </Modal>
            </Space>
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};
