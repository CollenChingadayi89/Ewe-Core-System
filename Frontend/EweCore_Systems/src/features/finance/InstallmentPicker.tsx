import { Table, Typography, Empty } from 'antd';
import type { OutstandingInstallment } from '../../services/api/procurement';
import { formatDate, formatMoney } from './payableUtils';

const { Text } = Typography;

interface InstallmentPickerProps {
  /** Selected installment ids (injected by Form.Item) */
  value?: string[];
  onChange?: (ids: string[]) => void;
  installments: OutstandingInstallment[];
  loading?: boolean;
}

/**
 * Pending procurement installments owed to the selected vendor. Ticking rows makes the
 * payable settle them. Only one currency can be paid per payable.
 */
export const InstallmentPicker = ({ value = [], onChange, installments, loading }: InstallmentPickerProps) => {
  const selectedCurrency = installments.find((i) => value.includes(i.id))?.currency;

  if (!loading && installments.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No pending procurement installments for this vendor" />;
  }

  return (
    <Table<OutstandingInstallment>
      size="small"
      rowKey="id"
      loading={loading}
      dataSource={installments}
      pagination={false}
      scroll={{ y: 220 }}
      rowSelection={{
        selectedRowKeys: value,
        onChange: (keys) => onChange?.(keys as string[]),
        getCheckboxProps: (row) => ({
          disabled: Boolean(selectedCurrency && row.currency !== selectedCurrency),
          'aria-label': `Pay ${row.record_number} ${row.label}`,
        }),
      }}
      columns={[
        {
          title: 'Procurement',
          key: 'procurement',
          render: (_, row) => (
            <>
              <Text strong>{row.record_number}</Text>
              <div><Text type="secondary" style={{ fontSize: 12 }} ellipsis>{row.item_description}</Text></div>
            </>
          ),
        },
        { title: 'Installment', dataIndex: 'label', key: 'label', width: 150 },
        { title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 105, render: (d: string) => formatDate(d) },
        {
          title: 'Outstanding',
          key: 'outstanding',
          width: 140,
          align: 'right',
          render: (_, row) => formatMoney(row.currency, row.outstanding),
        },
      ]}
    />
  );
};
