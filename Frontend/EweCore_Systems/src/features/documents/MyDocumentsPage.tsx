import { useState, useEffect } from 'react';
import { Button, Space, Row, Col, Card, Typography, Empty } from 'antd';
import {
  PlusOutlined,
  FileOutlined,
  DownloadOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { PageHeader, FilterBar, StatCard } from '../../components/common';
import type { Filter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useDocumentStore } from '../../store/documentStore';
import type { Document } from '../../types/index';
import { documentCategoryLabels, formatFileSize } from '../../mock/documents';
import { format } from 'date-fns';
import { UploadDocumentModal } from './components/UploadDocumentModal';
import { DocumentDetailsDrawer } from './components/DocumentDetailsDrawer';

const { Text, Title } = Typography;

export const MyDocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const { user } = useAuthStore();
  const { documents, loading, fetchDocuments, downloadDocument, uploadNewVersion } = useDocumentStore();

  // Fetch documents on mount
  useEffect(() => {
    if (user) {
      fetchDocuments(user.id, user.department);
    }
  }, [user]);

  // Filter accessible documents for this employee
  const accessibleDocuments = documents.filter(doc =>
    doc.status === 'approved' && (
      doc.accessLevel === 'organization' ||
      doc.department === user?.department
    )
  );

  // Apply search and filters
  const filteredDocuments = accessibleDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // My uploads
  const myUploads = documents.filter(doc => doc.uploadedBy === user?.id);

  // Handle document actions
  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document);
    setDetailsDrawerVisible(true);
  };

  const handleDownload = (document: Document) => {
    downloadDocument(document.id);
  };

  // Filters configuration
  const filters: Filter[] = [
    {
      type: 'search',
      placeholder: 'Search documents...',
      onChange: setSearchTerm,
      value: searchTerm,
      width: 300,
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
  ];

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter(undefined);
  };

  return (
    <div>
      <PageHeader
        title="My Documents"
        subtitle="Access department and organization-wide documents"
        breadcrumbs={[
          { title: 'Documents' },
          { title: 'My Documents' },
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
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Available Documents"
            value={accessibleDocuments.length}
            icon={<FolderOpenOutlined />}
            iconBg="rgba(59, 130, 246, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="My Uploads"
            value={myUploads.length}
            icon={<CloudUploadOutlined />}
            iconBg="rgba(0, 208, 132, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Department Docs"
            value={accessibleDocuments.filter(d => d.department === user?.department).length}
            icon={<FileOutlined />}
            iconBg="rgba(250, 140, 22, 0.1)"
          />
        </Col>
      </Row>

      {/* Filters */}
      <FilterBar filters={filters} onReset={handleReset} />

      {/* Documents Grid */}
      <Row gutter={[16, 16]}>
        {filteredDocuments.length === 0 ? (
          <Col span={24}>
            <Card>
              <Empty description="No documents found" />
            </Card>
          </Col>
        ) : (
          filteredDocuments.map((doc) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={doc.id}>
              <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetails(doc)}
                  >
                    View
                  </Button>,
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(doc)}
                  >
                    Download
                  </Button>,
                ]}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <FileOutlined style={{ fontSize: 48, color: '#00d084' }} />
                </div>
                <Title level={5} ellipsis={{ rows: 2 }} style={{ marginBottom: 8, minHeight: 48 }}>
                  {doc.title}
                </Title>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {documentCategoryLabels[doc.category]}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatFileSize(doc.fileSize)} • v{doc.currentVersion}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {doc.departmentName}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))
        )}
      </Row>

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
        onUploadNewVersion={
          selectedDocument && user && selectedDocument.uploadedBy === user.id
            ? async (doc, file, notes) => {
                await uploadNewVersion(doc.id, file, user.id, user.name, notes);
                if (user) {
                  fetchDocuments(user.id, user.department);
                }
              }
            : undefined
        }
        canEdit={selectedDocument ? selectedDocument.uploadedBy === user?.id : false}
        canDelete={selectedDocument ? selectedDocument.uploadedBy === user?.id : false}
      />
    </div>
  );
};
