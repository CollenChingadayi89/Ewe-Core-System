import { useState } from 'react';
import { Modal, Form, Input, Select, Upload, message, Alert, Space, Tag } from 'antd';
import { InboxOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useDocumentStore } from '../../../store/documentStore';
import { useAuthStore } from '../../../store/authStore';
import { documentCategoryLabels } from '../../../mock/documents';
import type { DocumentCategory, DocumentAccessLevel } from '../../../types/index';

const { TextArea } = Input;
const { Dragger } = Upload;

interface UploadDocumentModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const { uploadDocument, uploading } = useDocumentStore();
  const { user } = useAuthStore();

  // Maximum file size in bytes (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Allowed file types
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        message.error(
          'Invalid file type! Only PDF, Word, Excel, PowerPoint, and images are allowed.'
        );
        return false;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        message.error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB!`);
        return false;
      }

      // Add to file list
      setFileList([file]);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleSubmit = async () => {
    if (!user) {
      message.error('User not authenticated');
      return;
    }

    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    try {
      const values = await form.validateFields();
      const file = fileList[0] as any; // Get the actual File object

      await uploadDocument(user.id, user.name, user.department, {
        title: values.title,
        description: values.description,
        category: values.category,
        file: file,
        accessLevel: values.accessLevel,
        tags: tags.length > 0 ? tags : undefined,
      });

      message.success('Document uploaded successfully! It is pending approval.');
      form.resetFields();
      setFileList([]);
      setTags([]);
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload document');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setTags([]);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <FileOutlined />
          Upload Document
        </Space>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Upload"
      confirmLoading={uploading}
      width={650}
      okButtonProps={{ disabled: fileList.length === 0 }}
    >
      <Alert
        message="Document Approval Required"
        description="All uploaded documents require approval from a manager before they become visible to others."
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          label="Document File"
          name="file"
          rules={[{ required: true, message: 'Please select a file to upload' }]}
        >
          <Dragger {...uploadProps} maxCount={1}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Supported formats: PDF, Word, Excel, PowerPoint, Images (JPEG, PNG, GIF)
              <br />
              Maximum file size: 10MB
            </p>
          </Dragger>
        </Form.Item>

        <Form.Item
          label="Document Title"
          name="title"
          rules={[
            { required: true, message: 'Please enter document title' },
            { min: 3, message: 'Title must be at least 3 characters' },
            { max: 100, message: 'Title must not exceed 100 characters' },
          ]}
        >
          <Input placeholder="Enter a descriptive title for the document" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { max: 500, message: 'Description must not exceed 500 characters' },
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Brief description of the document content and purpose"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label="Category"
          name="category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select placeholder="Select document category">
            {Object.entries(documentCategoryLabels).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Access Level"
          name="accessLevel"
          rules={[{ required: true, message: 'Please select access level' }]}
          tooltip="Choose who can access this document after approval"
          initialValue="department"
        >
          <Select placeholder="Select access level">
            <Select.Option value="department">
              <Space>
                <Tag color="default">Department Only</Tag>
                <span>Visible only to {user?.department} department</span>
              </Space>
            </Select.Option>
            <Select.Option value="organization">
              <Space>
                <Tag color="blue">Organization-wide</Tag>
                <span>Visible to all employees</span>
              </Space>
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Tags (Optional)"
          tooltip="Add tags to help others find this document"
        >
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Add tags (press Enter to add)"
            value={tags}
            onChange={setTags}
            tokenSeparators={[',']}
            maxTagCount={5}
          />
        </Form.Item>

        <Alert
          message="Department"
          description={`This document will be associated with the ${user?.department} department.`}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Form>
    </Modal>
  );
};
