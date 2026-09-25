import { useEffect, useState } from 'react';
import { Modal, Button, Spin, Alert, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

/** Content types the browser can render safely inside the app. */
const PREVIEWABLE_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const PDF_TYPE = 'application/pdf';

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  /**
   * Fetches the document through the authenticated API client. Documents are never
   * exposed via public URLs, so they are loaded as a Blob and shown from an object URL.
   */
  loadDocument: () => Promise<Blob>;
}

type PreviewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; url: string; type: string };

/**
 * Mount one instance per document (render it conditionally with a `key`), so every
 * preview starts in the loading state and its object URL is revoked on unmount.
 */
export const DocumentPreviewModal = ({ open, onClose, fileName, loadDocument }: DocumentPreviewModalProps) => {
  const [state, setState] = useState<PreviewState>({ status: 'loading' });

  useEffect(() => {
    if (!open) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    loadDocument()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ status: 'ready', url: objectUrl, type: blob.type });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // loadDocument identity changes every render in callers; reload only when (re)opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDownload = () => {
    if (state.status !== 'ready') return;
    const link = document.createElement('a');
    link.href = state.url;
    link.download = fileName;
    link.click();
  };

  const renderBody = () => {
    if (state.status === 'loading') {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Spin tip="Loading document..."><div style={{ padding: 24 }} /></Spin>
        </div>
      );
    }

    if (state.status === 'error') {
      return (
        <Alert
          type="error"
          showIcon
          title="Unable to load this document"
          description="It may have been removed, or you may not have access to it."
        />
      );
    }

    if (state.type === PDF_TYPE) {
      return (
        <iframe
          src={state.url}
          title={fileName}
          style={{ width: '100%', height: '70vh', border: 'none' }}
        />
      );
    }

    if (PREVIEWABLE_IMAGE_TYPES.includes(state.type)) {
      return (
        <div style={{ textAlign: 'center' }}>
          <img src={state.url} alt={fileName} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
        </div>
      );
    }

    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <Text type="secondary">
          This file type can't be previewed in the browser. Download it to open it.
        </Text>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={fileName}
      width="min(1000px, 100vw)"
      centered
      destroyOnHidden
      footer={[
        <Button
          key="download"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          disabled={state.status !== 'ready'}
        >
          Download
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {renderBody()}
    </Modal>
  );
};
