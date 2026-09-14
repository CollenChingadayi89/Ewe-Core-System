import { useState } from 'react';
import { Drawer, Descriptions, Button, Space, Timeline, Tag, Divider, Typography, message, Upload, Modal, Form, Input } from 'antd';
import {
  DownloadOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  UploadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
  UserOutlined,
  FolderOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import type { Document } from '../../../types/index';
import { formatFileSize, documentCategoryLabels, documentCategoryColors } from '../../../mock/documents';
import { StatusTag } from '../../../components/common';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface DocumentDetailsDrawerProps {
  open: boolean;
  document: Document | null;
  onClose: () => void;
  onDownload: (doc: Document) => void;
  onApprove?: (doc: Document) => void;
  onReject?: (doc: Document) => void;
  onEdit?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  onUploadNewVersion?: (doc: Document, file: File, notes?: string) => void;
  canApprove?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

// File type icon mapping
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf':
      return <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />;
    case 'docx':
      return <FileWordOutlined style={{ fontSize: 48, color: '#1890ff' }} />;
    case 'xlsx':
      return <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
    case 'pptx':
      return <FilePptOutlined style={{ fontSize: 48, color: '#fa8c16' }} />;
    case 'image':
      return <FileImageOutlined style={{ fontSize: 48, color: '#722ed1' }} />;
    default:
      return <FileUnknownOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />;
  }
};

export const DocumentDetailsDrawer: React.FC<DocumentDetailsDrawerProps> = ({
  open,
  document,
  onClose,
  onDownload,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onUploadNewVersion,
  canApprove = false,
  canEdit = false,
  canDelete = false,
}) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();

  if (!document) return null;

  const handleDownload = () => {
    onDownload(document);
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(document);
      onClose();
    }
  };

  const handleReject = () => {
    if (onReject) {
      Modal.confirm({
        title: 'Reject Document',
        content: 'Are you sure you want to reject this document?',
        okText: 'Reject',
        okType: 'danger',
        onOk: () => {
          onReject(document);
          onClose();
        },
      });
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(document);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      Modal.confirm({
        title: 'Delete Document',
        content: `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
        okText: 'Delete',
        okType: 'danger',
        onOk: () => {
          onDelete(document);
          onClose();
        },
      });
    }
  };

  const handleUploadNewVersion = async () => {
    try {
      const values = await uploadForm.validateFields();
      if (onUploadNewVersion && values.file?.fileList?.length > 0) {
        const file = values.file.fileList[0].originFileObj;
        onUploadNewVersion(document, file, values.changeNotes);
        setUploadModalVisible(false);
        uploadForm.resetFields();
        message.success('New version uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <>
      <Drawer
        title="Document Details"
        open={open}
        onClose={onClose}
        width={700}
        extra={
          <Space>
            {canApprove && document.status === 'pending' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleApprove}
                >
                  Approve
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={handleReject}
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </Space>
        }
      >
        {/* File Preview Section */}
        <div style={{ textAlign: 'center', padding: '24px 0', background: '#fafafa', borderRadius: 8, marginBottom: 24 }}>
          {getFileIcon(document.fileType)}
          <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
            {document.title}
          </Title>
          <Text type="secondary">{document.fileName}</Text>
          <div style={{ marginTop: 12 }}>
            <StatusTag status={document.status} />
          </div>
        </div>

        {/* Document Information */}
        <Descriptions title="Document Information" column={1} bordered>
          <Descriptions.Item label="Description">
            {document.description || <Text type="secondary">No description provided</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Category">
            <Tag color={documentCategoryColors[document.category]}>
              {documentCategoryLabels[document.category]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="File Type">
            {document.fileType.toUpperCase()}
          </Descriptions.Item>
          <Descriptions.Item label="File Size">
            {formatFileSize(document.fileSize)}
          </Descriptions.Item>
          <Descriptions.Item label="Current Version">
            <Tag>v{document.currentVersion}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Access Level">
            <Tag color={document.accessLevel === 'organization' ? 'blue' : 'default'}>
              {document.accessLevel === 'organization' ? 'Organization-wide' : 'Department Only'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            <Space>
              <FolderOutlined />
              {document.departmentName}
            </Space>
          </Descriptions.Item>
          {document.tags && document.tags.length > 0 && (
            <Descriptions.Item label="Tags">
              <Space wrap>
                <TagsOutlined />
                {document.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Uploaded By">
            <Space>
              <UserOutlined />
              {document.uploadedByName}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Upload Date">
            {format(new Date(document.uploadedAt), 'MMMM dd, yyyy HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {format(new Date(document.updatedAt), 'MMMM dd, yyyy HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Downloads">
            {document.downloadCount}
          </Descriptions.Item>
          <Descriptions.Item label="Views">
            {document.viewCount}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Version History */}
        <Title level={5}>Version History</Title>
        <Timeline
          style={{ marginTop: 16 }}
          items={document.versions.map((version, index) => ({
            color: index === 0 ? 'green' : 'gray',
            dot: index === 0 ? <ClockCircleOutlined style={{ fontSize: 16 }} /> : undefined,
            children: (
              <div>
                <div style={{ fontWeight: 500 }}>
                  Version {version.version}
                  {index === 0 && <Tag color="green" style={{ marginLeft: 8 }}>Current</Tag>}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                  {formatFileSize(version.fileSize)} • Uploaded by {version.uploadedByName}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {format(new Date(version.uploadedAt), 'MMMM dd, yyyy HH:mm')}
                </div>
                {version.changeNotes && (
                  <div style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                    "{version.changeNotes}"
                  </div>
                )}
              </div>
            ),
          }))}
        />

        <Divider />

        {/* Actions */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          {canEdit && (
            <Space>
              <Button icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
                Upload New Version
              </Button>
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                Edit Details
              </Button>
            </Space>
          )}
          {canDelete && (
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete Document
            </Button>
          )}
        </Space>
      </Drawer>

      {/* Upload New Version Modal */}
      <Modal
        title="Upload New Version"
        open={uploadModalVisible}
        onOk={handleUploadNewVersion}
        onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
        }}
        width={500}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            label="New File"
            name="file"
            rules={[{ required: true, message: 'Please select a file' }]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            label="Change Notes (Optional)"
            name="changeNotes"
          >
            <TextArea
              rows={3}
              placeholder="Briefly describe what changed in this version..."
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
