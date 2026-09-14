import { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Row,
  Col,
  Modal,
  Tag,
  Typography,
  Tabs,
  Dropdown,
  message,
} from 'antd';
import {
  PlusOutlined,
  FileOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CloudUploadOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { PageHeader, FilterBar, DataTable, StatusTag, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useDocumentStore } from '../../store/documentStore';
import type { Document, DocumentCategory } from '../../types/index';
import { documentCategoryLabels, documentCategoryColors, formatFileSize } from '../../mock/documents';
import { format } from 'date-fns';
import { UploadDocumentModal } from './components/UploadDocumentModal';
import { DocumentDetailsDrawer } from './components/DocumentDetailsDrawer';

const { Text } = Typography;

// File type icon mapping
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf':
      return <FilePdfOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />;
    case 'docx':
      return <FileWordOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
    case 'xlsx':
      return <FileExcelOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
    case 'pptx':
      return <FilePptOutlined style={{ fontSize: 20, color: '#fa8c16' }} />;
    case 'image':
      return <FileImageOutlined style={{ fontSize: 20, color: '#722ed1' }} />;
    default:
      return <FileUnknownOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />;
  }
};

export const DocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [accessLevelFilter, setAccessLevelFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const { user } = useAuthStore();
  const { documents, loading, fetchDocuments, deleteDocument, approveDocument, rejectDocument, downloadDocument, uploadNewVersion } = useDocumentStore();

  // Fetch documents on mount
  useEffect(() => {
    if (user) {
      fetchDocuments(user.id, user.department);
    }
  }, [user]);

  // Calculate statistics
  const totalDocuments = documents.filter(doc => doc.status === 'approved').length;
  const pendingApproval = documents.filter(doc => doc.status === 'pending').length;
  const myUploads = documents.filter(doc => doc.uploadedBy === user?.id).length;
  const totalDownloads = documents.reduce((sum, doc) => sum + doc.downloadCount, 0);

  // Filter documents based on active tab
  const getFilteredByTab = () => {
    if (activeTab === 'pending') {
      return documents.filter(doc => doc.status === 'pending');
    }
    if (activeTab === 'my-uploads') {
      return documents.filter(doc => doc.uploadedBy === user?.id);
    }
    if (activeTab === 'sops') {
      return documents.filter(doc => doc.status === 'approved' && doc.category === 'sop');
    }
    if (activeTab === 'policies') {
      return documents.filter(doc => doc.status === 'approved' && doc.category === 'policy');
    }
    if (activeTab === 'vault') {
      return documents.filter(doc => doc.status === 'approved' && ['contract', 'form', 'training-material', 'report', 'other'].includes(doc.category));
    }
    return documents.filter(doc => doc.status === 'approved');
  };

  // Apply search and filters
  const filteredDocuments = getFilteredByTab().filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !categoryFilter || doc.category === categoryFilter;
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    const matchesAccessLevel = !accessLevelFilter || doc.accessLevel === accessLevelFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesAccessLevel;
  });

  // Handle document actions
  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document);
    setDetailsDrawerVisible(true);
  };

  const handleDownload = (document: Document) => {
    downloadDocument(document.id);
    message.success(`Downloading ${document.fileName}`);
  };

  const handleApprove = async (document: Document) => {
    if (!user) return;
    await approveDocument(document.id, user.id, user.name);
    message.success('Document approved successfully');
  };

  const handleReject = async (document: Document) => {
    if (!user) return;
    Modal.confirm({
      title: 'Reject Document',
      content: 'Are you sure you want to reject this document?',
      okText: 'Reject',
      okType: 'danger',
      onOk: async () => {
        await rejectDocument(document.id, user.id, user.name, 'Rejected by manager');
        message.success('Document rejected');
      },
    });
  };

  const handleEdit = (document: Document) => {
    message.info('Edit functionality will be implemented');
  };

  const handleDelete = async (document: Document) => {
    Modal.confirm({
      title: 'Delete Document',
      content: `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteDocument(document.id);
        message.success('Document deleted successfully');
      },
    });
  };

  // Filters configuration
  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search documents by title, description, or tags...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 350,
    },
    {
      type: 'select',
      label: 'Category',
      placeholder: 'All Categories',
      onChange: setCategoryFilter,
      value: categoryFilter,
      width: 200,
      options: Object.entries(documentCategoryLabels).map(([value, label]) => ({
        label,
        value,
      })),
    },
    {
      type: 'select',
      label: 'Access Level',
      placeholder: 'All Levels',
      onChange: setAccessLevelFilter,
      value: accessLevelFilter,
      width: 180,
      options: [
        { label: 'Department', value: 'department' },
        { label: 'Organization-wide', value: 'organization' },
      ],
    },
  ];

  // Add status filter only for "All Documents" tab
  if (activeTab === 'all') {
    filters.push({
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      onChange: setStatusFilter,
      value: statusFilter,
      width: 150,
      options: [
        { label: 'Approved', value: 'approved' },
        { label: 'Pending', value: 'pending' },
        { label: 'Rejected', value: 'rejected' },
      ],
    });
  }

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter(undefined);
    setStatusFilter(undefined);
    setAccessLevelFilter(undefined);
  };

  // Check if user can perform actions
  const canApprove = (doc: Document) => {
    return user?.role && ['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin'].includes(user.role) && doc.status === 'pending';
  };

  const canEdit = (doc: Document) => {
    return doc.uploadedBy === user?.id || user?.role === 'admin';
  };

  const canDelete = (doc: Document) => {
    return doc.uploadedBy === user?.id || user?.role === 'admin';
  };

  // Table columns
  const columns: ColumnsType<Document> = [
    {
      title: 'Document',
      key: 'document',
      width: 300,
      render: (_, record) => (
        <Space>
          {getFileIcon(record.fileType)}
          <div>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{record.title}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.fileName} • {formatFileSize(record.fileSize)}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 180,
      render: (category: DocumentCategory) => (
        <Tag color={documentCategoryColors[category]}>
          {documentCategoryLabels[category]}
        </Tag>
      ),
    },
    {
      title: 'Access Level',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      width: 150,
      render: (level: string) => (
        <Tag color={level === 'organization' ? 'blue' : 'default'}>
          {level === 'organization' ? 'Organization-wide' : 'Department Only'}
        </Tag>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 130,
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedByName',
      key: 'uploadedByName',
      width: 150,
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {format(new Date(record.uploadedAt), 'MMM dd, yyyy')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'currentVersion',
      key: 'currentVersion',
      width: 80,
      align: 'center',
      render: (version: number) => <Tag>v{version}</Tag>,
    },
    {
      title: 'Downloads',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.downloadCount - b.downloadCount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const items: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => handleViewDetails(record),
          },
          {
            key: 'download',
            icon: <DownloadOutlined />,
            label: 'Download',
            onClick: () => handleDownload(record),
          },
        ];

        if (canApprove(record)) {
          items.push(
            { type: 'divider' },
            {
              key: 'approve',
              icon: <CheckOutlined />,
              label: 'Approve',
              onClick: () => handleApprove(record),
            },
            {
              key: 'reject',
              icon: <CloseOutlined />,
              label: 'Reject',
              danger: true,
              onClick: () => handleReject(record),
            }
          );
        }

        if (canEdit(record)) {
          items.push(
            { type: 'divider' },
            {
              key: 'edit',
              icon: <EditOutlined />,
              label: 'Edit',
              onClick: () => handleEdit(record),
            }
          );
        }

        if (canDelete(record)) {
          items.push({
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDelete(record),
          });
        }

        items.push(
          { type: 'divider' },
          {
            key: 'history',
            icon: <HistoryOutlined />,
            label: 'Version History',
            onClick: () => message.info('Version history will be shown'),
          }
        );

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  // Calculate counts for tabs
  const sopsCount = documents.filter(doc => doc.status === 'approved' && doc.category === 'sop').length;
  const policiesCount = documents.filter(doc => doc.status === 'approved' && doc.category === 'policy').length;
  const vaultCount = documents.filter(doc => doc.status === 'approved' && ['contract', 'form', 'training-material', 'report', 'other'].includes(doc.category)).length;

  // Tab items
  const tabItems = [
    {
      key: 'all',
      label: 'All Documents',
      children: null,
    },
    {
      key: 'sops',
      label: (
        <Space>
          <FileOutlined />
          SOPs
          {sopsCount > 0 && (
            <Tag color="blue" style={{ marginLeft: 4 }}>
              {sopsCount}
            </Tag>
          )}
        </Space>
      ),
      children: null,
    },
    {
      key: 'policies',
      label: (
        <Space>
          <SafetyCertificateOutlined />
          Policies
          {policiesCount > 0 && (
            <Tag color="green" style={{ marginLeft: 4 }}>
              {policiesCount}
            </Tag>
          )}
        </Space>
      ),
      children: null,
    },
    {
      key: 'vault',
      label: (
        <Space>
          <FolderOpenOutlined />
          Documents Vault
          {vaultCount > 0 && (
            <Tag color="purple" style={{ marginLeft: 4 }}>
              {vaultCount}
            </Tag>
          )}
        </Space>
      ),
      children: null,
    },
    {
      key: 'pending',
      label: (
        <Space>
          Pending Approval
          {pendingApproval > 0 && (
            <Tag color="orange" style={{ marginLeft: 4 }}>
              {pendingApproval}
            </Tag>
          )}
        </Space>
      ),
      children: null,
    },
    {
      key: 'my-uploads',
      label: 'My Uploads',
      children: null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Document Management"
        subtitle={`${filteredDocuments.length} documents found`}
        breadcrumbs={[
          { title: 'Document Management' },
          { title: 'All Documents' },
        ]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Upload Document
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="Total Documents"
            value={totalDocuments}
            icon={<FolderOpenOutlined />}
            iconBg="rgba(59, 130, 246, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="SOPs"
            value={sopsCount}
            icon={<FileOutlined />}
            iconBg="rgba(59, 130, 246, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="Policies"
            value={policiesCount}
            icon={<SafetyCertificateOutlined />}
            iconBg="rgba(34, 197, 94, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="Vault Items"
            value={vaultCount}
            icon={<FolderOpenOutlined />}
            iconBg="rgba(168, 85, 247, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="Pending"
            value={pendingApproval}
            icon={<ClockCircleOutlined />}
            iconBg="rgba(250, 140, 22, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="Downloads"
            value={totalDownloads}
            icon={<DownloadOutlined />}
            iconBg="rgba(114, 46, 209, 0.1)"
          />
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {/* Filters */}
      <FilterBar filters={filters} onReset={handleReset} />

      {/* Documents Table */}
      <DataTable
        columns={columns}
        dataSource={filteredDocuments}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} documents`,
        }}
      />

      {/* Upload Modal */}
      <UploadDocumentModal
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onSuccess={() => {
          setUploadModalVisible(false);
          if (user) {
            fetchDocuments(user.id, user.department);
          }
        }}
      />

      {/* Document Details Drawer */}
      <DocumentDetailsDrawer
        open={detailsDrawerVisible}
        document={selectedDocument}
        onClose={() => {
          setDetailsDrawerVisible(false);
          setSelectedDocument(null);
        }}
        onDownload={handleDownload}
        onApprove={selectedDocument && canApprove(selectedDocument) ? handleApprove : undefined}
        onReject={selectedDocument && canApprove(selectedDocument) ? handleReject : undefined}
        onEdit={selectedDocument && canEdit(selectedDocument) ? handleEdit : undefined}
        onDelete={selectedDocument && canDelete(selectedDocument) ? handleDelete : undefined}
        onUploadNewVersion={
          selectedDocument && canEdit(selectedDocument) && user
            ? async (doc, file, notes) => {
                await uploadNewVersion(doc.id, file, user.id, user.name, notes);
                if (user) {
                  fetchDocuments(user.id, user.department);
                }
              }
            : undefined
        }
        canApprove={selectedDocument ? canApprove(selectedDocument) : false}
        canEdit={selectedDocument ? canEdit(selectedDocument) : false}
        canDelete={selectedDocument ? canDelete(selectedDocument) : false}
      />
    </div>
  );
};
