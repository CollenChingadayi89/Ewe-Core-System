import { useState, type ReactNode } from 'react';
import { Descriptions, Table, Typography, Tag, Empty, Button, Alert } from 'antd';
import { EyeOutlined, StopOutlined, TrophyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { StatusTag, DocumentPreviewModal } from '../../components/common';
import {
  procurementApi,
  type ProcurementDetailResponse,
  type ProcurementLineItem,
  type ProcurementQuotation,
} from '../../services/api/procurement';

const { Text, Title, Paragraph } = Typography;

interface ProcurementDetailsContentProps {
  request: ProcurementDetailResponse;
  /** Maps employee IDs to display names, used for assigned employees. */
  employeeNames?: Record<string, string>;
  /** Final approver: open the "select winner & approve" dialog. */
  onSelectWinner?: (request: ProcurementDetailResponse) => void;
  onOpenRecord?: (recordId: string) => void;
  /** Provided when the current user (the requester) can cancel this request */
  onCancelRequest?: (request: ProcurementDetailResponse) => void;
}

const formatMoney = (currency: string, value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (value: string | null | undefined, withTime = false) =>
  value ? dayjs(value).format(withTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY') : '—';

const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** Only http(s) URLs are rendered as links, so stored values can never inject javascript: URLs. */
const isSafeUrl = (value: string) => /^https?:\/\//i.test(value);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ marginBottom: 24 }}>
    <Title level={5} style={{ marginBottom: 12 }}>{title}</Title>
    {children}
  </section>
);

const LongText = ({ value }: { value: string | null | undefined }) =>
  value ? (
    <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{value}</Paragraph>
  ) : (
    <Text type="secondary">Not provided</Text>
  );

/**
 * Full read-only view of a procurement request, including the in-app quotation document viewer.
 * Shared by the procurement details drawer and the approvals page.
 * Render with `key={request.id}` so an open document preview doesn't carry over between requests.
 */
export const ProcurementDetailsContent = ({
  request,
  employeeNames = {},
  onSelectWinner,
  onOpenRecord,
  onCancelRequest,
}: ProcurementDetailsContentProps) => {
  const canSelectWinner = Boolean(onSelectWinner && request.approval?.can_act && request.approval.is_final_stage);
  const winner = request.selected_quotation_index != null ? request.quotations[request.selected_quotation_index] : null;
  const currency = request.currency || 'ZWG';
  const [preview, setPreview] = useState<{ index: number; fileName: string } | null>(null);

  const lineItemColumns: ColumnsType<ProcurementLineItem> = [
    { title: '#', key: 'index', width: 48, render: (_, __, index) => index + 1 },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      align: 'right',
      render: (qty, item) => `${Number(qty).toLocaleString()} ${item.unit}`,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 130,
      align: 'right',
      render: (price) => formatMoney(currency, price),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (amount) => <Text strong>{formatMoney(currency, amount)}</Text>,
    },
  ];

  const quotationColumns: ColumnsType<ProcurementQuotation> = [
    { title: '#', key: 'index', width: 48, render: (_, __, index) => index + 1 },
    {
      title: 'Vendor',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      render: (name: string, quotation) => (
        <>
          {name}
          {quotation.is_selected && <Tag color="green" style={{ marginLeft: 8 }}>Selected</Tag>}
        </>
      ),
    },
    {
      title: 'Document',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (fileName: string | null, quotation) => (
        <>
          <div>{fileName || '—'}</div>
          {quotation.file_size != null && (
            <Text type="secondary" style={{ fontSize: 12 }}>{formatFileSize(quotation.file_size)}</Text>
          )}
        </>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 110,
      align: 'right',
      render: (_, quotation, index) =>
        quotation.has_document ? (
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setPreview({ index, fileName: quotation.file_name || `Quotation ${index + 1}` })}
          >
            View
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>Not uploaded</Text>
        ),
    },
  ];

  return (
    <>
      <Section title="Overview">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
          <Descriptions.Item label="Request Number">{request.request_number}</Descriptions.Item>
          <Descriptions.Item label="Status"><StatusTag status={request.status} /></Descriptions.Item>
          <Descriptions.Item label="Priority">{request.priority_display}</Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <Text strong style={{ fontSize: 16 }}>{formatMoney(currency, request.total_amount)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Item/Service" span={{ xs: 1, sm: 2 }}>
            <LongText value={request.item_description} />
          </Descriptions.Item>
          <Descriptions.Item label="Category">{request.category_display}</Descriptions.Item>
          <Descriptions.Item label="Request Type">{request.request_type_display}</Descriptions.Item>
          <Descriptions.Item label="Requested By">{request.employee_name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Department">{request.employee_department || '—'}</Descriptions.Item>
          <Descriptions.Item label="Request Date">{formatDate(request.request_date)}</Descriptions.Item>
          <Descriptions.Item label="Required By">{formatDate(request.required_by_date)}</Descriptions.Item>
          <Descriptions.Item label="Delivery Location">{request.delivery_location || '—'}</Descriptions.Item>
          <Descriptions.Item label="Budget Code">{request.budget_code || '—'}</Descriptions.Item>
          <Descriptions.Item label="Supplier">{request.vendor_name || 'Not yet awarded'}</Descriptions.Item>
          <Descriptions.Item label="Beneficiary">
            {request.is_for_employee ? 'Specific employee(s)' : 'Organization'}
          </Descriptions.Item>
          {request.is_for_employee && (
            <Descriptions.Item label="Assigned Employees" span={{ xs: 1, sm: 2 }}>
              {request.assigned_employees.length > 0
                ? request.assigned_employees.map((id) => (
                    <Tag key={id}>{employeeNames[id] || 'Unknown employee'}</Tag>
                  ))
                : '—'}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Section>

      <Section title={`Line Items (${request.line_items.length})`}>
        {request.line_items.length > 0 ? (
          <Table
            dataSource={request.line_items}
            columns={lineItemColumns}
            rowKey={(_, index) => String(index)}
            pagination={false}
            size="small"
            scroll={{ x: 560 }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4} align="right">
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>{formatMoney(currency, request.total_amount)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No line items recorded" />
        )}
      </Section>

      <Section title={`Vendor Quotations (${request.quotations.length})`}>
        {request.quotations.length > 0 ? (
          <Table
            dataSource={request.quotations}
            columns={quotationColumns}
            rowKey={(_, index) => String(index)}
            pagination={false}
            size="small"
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No quotations attached" />
        )}
      </Section>

      <Section title="Justification & Specifications">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Business Justification">
            <LongText value={request.business_justification} />
          </Descriptions.Item>
          <Descriptions.Item label="Technical Specifications">
            <LongText value={request.technical_specifications} />
          </Descriptions.Item>
          <Descriptions.Item label="Additional Notes">
            <LongText value={request.notes} />
          </Descriptions.Item>
        </Descriptions>
      </Section>

      {onCancelRequest && (
        <Alert
          type="warning"
          style={{ marginBottom: 24 }}
          title="This request is still going through approval. You can withdraw it; everyone in the approval workflow will be notified."
          action={
            <Button danger icon={<StopOutlined />} onClick={() => onCancelRequest(request)}>
              Cancel Request
            </Button>
          }
        />
      )}

      {canSelectWinner && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          title="You are the final approver. Select the winning quotation and give your reason to approve."
          action={
            <Button type="primary" icon={<TrophyOutlined />} onClick={() => onSelectWinner?.(request)}>
              Select winner & approve
            </Button>
          }
        />
      )}

      {winner && (
        <Section title="Award">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            <Descriptions.Item label="Winning Quotation">
              <Text strong>{winner.vendor_name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Selected By">
              {request.selected_by_name || '—'} {request.selected_at ? `on ${formatDate(request.selected_at, true)}` : ''}
            </Descriptions.Item>
            <Descriptions.Item label="Reason" span={{ xs: 1, sm: 2 }}>
              <LongText value={request.selection_reason} />
            </Descriptions.Item>
            {request.record && (
              <Descriptions.Item label="Procurement Record" span={{ xs: 1, sm: 2 }}>
                {onOpenRecord ? (
                  <Button type="link" style={{ padding: 0 }} onClick={() => onOpenRecord(request.record!.id)}>
                    {request.record.record_number}
                  </Button>
                ) : request.record.record_number}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Section>
      )}

      <Section title="Approval & Fulfilment">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
          <Descriptions.Item label="Approved By">{request.approved_by_name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Approved On">{formatDate(request.approved_date, true)}</Descriptions.Item>
          <Descriptions.Item label="PO Number">{request.po_number || '—'}</Descriptions.Item>
          <Descriptions.Item label="Ordered On">{formatDate(request.ordered_date)}</Descriptions.Item>
          <Descriptions.Item label="Received On">{formatDate(request.received_date)}</Descriptions.Item>
          <Descriptions.Item label="Last Updated">{formatDate(request.updated_at, true)}</Descriptions.Item>
          {request.rejection_reason && (
            <Descriptions.Item label="Rejection Reason" span={{ xs: 1, sm: 2 }}>
              <Text type="danger" style={{ whiteSpace: 'pre-wrap' }}>{request.rejection_reason}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Section>

      {request.attachments.length > 0 && (
        <Section title="Attachments">
          {request.attachments.map((url, index) =>
            isSafeUrl(url) ? (
              <div key={index}>
                <a href={url} target="_blank" rel="noopener noreferrer">Attachment {index + 1}</a>
              </div>
            ) : (
              <div key={index}><Text type="secondary">{url}</Text></div>
            )
          )}
        </Section>
      )}

      {preview && (
        <DocumentPreviewModal
          key={preview.index}
          open
          onClose={() => setPreview(null)}
          fileName={preview.fileName}
          loadDocument={() => procurementApi.getQuotationDocument(request.id, preview.index)}
        />
      )}
    </>
  );
};
