import { Drawer } from 'antd';
import type { ProcurementDetailResponse } from '../../services/api/procurement';
import { ProcurementDetailsContent } from './ProcurementDetailsContent';

interface ProcurementDetailsDrawerProps {
  request: ProcurementDetailResponse | null;
  open: boolean;
  onClose: () => void;
  /** Maps employee IDs to display names, used for assigned employees. */
  employeeNames: Record<string, string>;
}

export const ProcurementDetailsDrawer = ({
  request,
  open,
  onClose,
  employeeNames,
}: ProcurementDetailsDrawerProps) => (
  <Drawer
    title={request ? `Procurement Request ${request.request_number}` : 'Procurement Request'}
    placement="right"
    size="min(760px, 100vw)"
    onClose={onClose}
    open={open}
    destroyOnHidden
  >
    {request && (
      <ProcurementDetailsContent key={request.id} request={request} employeeNames={employeeNames} />
    )}
  </Drawer>
);
