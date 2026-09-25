import { useState } from 'react';
import { Button, Select, Space, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { VendorCreateRequest, VendorDetailResponse, VendorListResponse } from '../../services/api/payables';
import { QuickAddVendorModal } from './QuickAddVendorModal';

interface VendorSelectProps {
  /** Injected by Form.Item */
  value?: string;
  onChange?: (vendorId: string) => void;
  vendors: VendorListResponse[];
  onAddVendor: (data: VendorCreateRequest) => Promise<VendorDetailResponse>;
  /** Called after a vendor is added via "+" (it is also selected). */
  onVendorAdded?: (vendor: VendorDetailResponse) => void;
  /** Vendors that can't be chosen here (e.g. already used by another quotation). */
  disabledIds?: string[];
  placeholder?: string;
}

/** Vendor/supplier picker with a "+" to add a missing vendor on the spot; the new vendor is auto-selected. */
export const VendorSelect = ({
  value,
  onChange,
  vendors,
  onAddVendor,
  onVendorAdded,
  disabledIds = [],
  placeholder = 'Select vendor or supplier',
}: VendorSelectProps) => {
  const [addOpen, setAddOpen] = useState(false);

  const handleCreated = (vendor: VendorDetailResponse) => {
    setAddOpen(false);
    onChange?.(vendor.id);
    onVendorAdded?.(vendor);
  };

  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          showSearch
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          optionFilterProp="label"
          notFoundContent="No match — use + to add a new vendor"
          options={vendors.map((v) => ({
            value: v.id,
            label: `${v.company_name} (${v.vendor_code}) · ${v.vendor_type_display}`,
            disabled: disabledIds.includes(v.id) && v.id !== value,
          }))}
        />
        <Tooltip title="Add a new vendor or supplier">
          <Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)} aria-label="Add a new vendor" />
        </Tooltip>
      </Space.Compact>
      <QuickAddVendorModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={onAddVendor}
        onCreated={handleCreated}
      />
    </>
  );
};
