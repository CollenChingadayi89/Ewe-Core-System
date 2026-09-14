import { Table, Card } from 'antd';
import type { TableProps } from 'antd';
import { CSSProperties } from 'react';

interface DataTableProps<T = any> extends TableProps<T> {
  cardStyle?: CSSProperties;
  cardBodyStyle?: CSSProperties;
  title?: string;
}

export function DataTable<T extends object = any>({
  cardStyle,
  cardBodyStyle,
  title,
  ...tableProps
}: DataTableProps<T>) {
  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...cardStyle,
      }}
      bodyStyle={{
        padding: 0,
        ...cardBodyStyle,
      }}
      title={
        title && (
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#32373c' }}>{title}</div>
        )
      }
    >
      <Table
        {...tableProps}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          ...tableProps.pagination,
        }}
        style={{
          ...tableProps.style,
        }}
      />

      <style>
        {`
          /* Enhanced Table Styles */
          .ant-table-wrapper .ant-table-thead > tr > th {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            color: #32373c;
            font-weight: 600;
            font-size: 13px;
            padding: 16px;
            border-bottom: 2px solid #e8e8e8;
          }

          .ant-table-wrapper .ant-table-tbody > tr > td {
            padding: 14px 16px;
            font-size: 13px;
            color: #595959;
          }

          .ant-table-wrapper .ant-table-tbody > tr:hover > td {
            background: #f5f5f5 !important;
          }

          .ant-table-wrapper .ant-table-row {
            transition: all 0.2s ease;
          }

          .ant-table-wrapper .ant-pagination {
            padding: 16px 20px;
            margin: 0;
          }

          .ant-table-wrapper .ant-table-pagination.ant-pagination {
            margin: 0;
          }

          /* Custom scrollbar for table */
          .ant-table-body::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          .ant-table-body::-webkit-scrollbar-track {
            background: #f5f5f5;
            border-radius: 4px;
          }

          .ant-table-body::-webkit-scrollbar-thumb {
            background: #d9d9d9;
            border-radius: 4px;
          }

          .ant-table-body::-webkit-scrollbar-thumb:hover {
            background: #bfbfbf;
          }
        `}
      </style>
    </Card>
  );
}
