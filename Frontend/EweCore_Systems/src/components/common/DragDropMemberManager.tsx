/**
 * DragDropMemberManager Component
 *
 * Modern drag-and-drop interface for managing approval group members.
 * Enforces "one employee = one group" constraint.
 *
 * Features:
 * - Drag employees from Available → Group Members to add
 * - Drag members from Group Members → Available to remove
 * - Click role badge to cycle roles (Member → Lead → Admin)
 * - Search/filter employees
 * - Warning when employee is in another group
 * - Bulk save (no API calls until user clicks Save)
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Alert,
  message as antMessage,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  WarningOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const { Text } = Typography;

// Types
interface Employee {
  id: string;
  employee_id?: string; // Backend sends this
  employee_number: string;
  employee_name?: string; // Backend sends full name as string
  first_name?: string; // For existing data
  last_name?: string; // For existing data
  department?: string;
  group_id?: string | null;
  group_code?: string | null;
  group_name?: string | null;
  role?: 'member' | 'lead' | 'admin' | null;
}

interface GroupMember extends Employee {
  role: 'member' | 'lead' | 'admin';
}

interface Props {
  visible: boolean;
  group: {
    id: string;
    code: string;
    name: string;
  } | null;
  onClose: () => void;
  onSave: (addedMembers: GroupMember[], removedMemberIds: string[], oldGroupId?: string | null) => Promise<void>;
  allEmployees: Employee[];
  currentMembers: GroupMember[];
}

// Role color mapping
const roleColors: Record<string, string> = {
  admin: 'red',
  lead: 'orange',
  member: 'blue',
};

// Droppable Zone Component
interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const DroppableZone = ({ id, children, style }: DroppableZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderColor: isOver ? '#1890ff' : style?.borderColor,
        backgroundColor: isOver ? (id === 'members-zone' ? '#e6f4ff' : '#f5f5f5') : style?.backgroundColor,
        transition: 'all 0.2s',
      }}
    >
      {children}
    </div>
  );
};

// Draggable Employee Card Component
interface DraggableCardProps {
  employee: Employee | GroupMember;
  isAvailable: boolean;
  onRoleClick?: () => void;
  isDragging?: boolean;
}

const DraggableCard = ({ employee, isAvailable, onRoleClick, isDragging }: DraggableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({ id: employee.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasExistingGroup = employee.group_id && isAvailable;
  const role = (employee as GroupMember).role;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="employee-card"
    >
      <Space orientation="vertical" size={4} style={{ width: '100%' }}>
        <Space>
          <UserOutlined />
          <Text strong>{employee.employee_name || `${employee.first_name} ${employee.last_name}`}</Text>
        </Space>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {employee.employee_number}
        </Text>
        {employee.department && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {employee.department}
          </Text>
        )}
        {hasExistingGroup && (
          <Tag color="warning" icon={<WarningOutlined />} style={{ fontSize: '11px' }}>
            In {employee.group_code}
          </Tag>
        )}
        {!isAvailable && role && (
          <Tag
            color={roleColors[role]}
            style={{ cursor: 'pointer', fontSize: '11px' }}
            onClick={(e) => {
              e.stopPropagation();
              onRoleClick?.();
            }}
          >
            {role.toUpperCase()}
          </Tag>
        )}
      </Space>
    </div>
  );
};

// Main Component
export const DragDropMemberManager = ({
  visible,
  group,
  onClose,
  onSave,
  allEmployees,
  currentMembers,
}: Props) => {
  // Normalize currentMembers to use employee IDs for consistent comparison
  // Store mapping from employee ID to membership ID for removal operations
  const normalizedCurrentMembers = useMemo(() => {
    return currentMembers.map(member => {
      // Extract employee details if available
      const employeeDetails = (member as any).employee_details || {};

      return {
        ...member,
        membershipId: member.id, // Store original membership ID
        id: member.employee_id || member.id, // Use employee ID as primary identifier
        // Ensure name fields are available at top level
        employee_name: employeeDetails.employee_name || member.employee_name,
        first_name: employeeDetails.first_name || member.first_name,
        last_name: employeeDetails.last_name || member.last_name,
        employee_number: employeeDetails.employee_number || member.employee_number,
        department: employeeDetails.department_name || member.department,
      };
    });
  }, [currentMembers]);

  const employeeIdToMembershipId = useMemo(() => {
    const map = new Map<string, string>();
    currentMembers.forEach(member => {
      const employeeId = member.employee_id || member.id;
      map.set(employeeId, member.id); // Map employee ID -> membership ID
    });
    return map;
  }, [currentMembers]);

  // State
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchMembers, setSearchMembers] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>(normalizedCurrentMembers);
  const [showWarning, setShowWarning] = useState(false);
  const [movingEmployee, setMovingEmployee] = useState<Employee | null>(null);
  const [employeeOldGroupId, setEmployeeOldGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync members state with currentMembers prop (reset when group changes)
  useEffect(() => {
    setMembers(normalizedCurrentMembers);
    setSearchAvailable('');
    setSearchMembers('');
    setRoleFilter('all');
  }, [normalizedCurrentMembers]);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Normalize employee data (backend sends employee_id, we need id)
  const normalizedEmployees = useMemo(() => {
    return allEmployees.map(emp => ({
      ...emp,
      id: emp.employee_id || emp.id, // Use employee_id if present, fallback to id
    }));
  }, [allEmployees]);

  // Available employees (excluding current members)
  const availableEmployees = useMemo(() => {
    const memberIds = new Set(members.map(m => m.id || m.employee_id));
    return normalizedEmployees
      .filter(emp => !memberIds.has(emp.id))
      .filter(emp => {
        const searchLower = searchAvailable.toLowerCase();
        const fullName = emp.employee_name || `${emp.first_name} ${emp.last_name}`;
        return fullName.toLowerCase().includes(searchLower) ||
               emp.employee_number.toLowerCase().includes(searchLower);
      });
  }, [normalizedEmployees, members, searchAvailable]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const searchLower = searchMembers.toLowerCase();
      const fullName = member.employee_name || `${member.first_name} ${member.last_name}`;
      const matchesSearch =
        fullName.toLowerCase().includes(searchLower) ||
        member.employee_number.toLowerCase().includes(searchLower);
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchMembers, roleFilter]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const targetZone = over.id as string;

    // Find the dragged employee
    const fromAvailable = availableEmployees.find(e => e.id === draggedId);
    const fromMembers = members.find(m => m.id === draggedId);

    if (fromAvailable && targetZone === 'members-zone') {
      // Adding employee to group
      if (fromAvailable.group_id && fromAvailable.group_id !== group?.id) {
        // Employee is in another group - show warning and store old group ID
        setMovingEmployee(fromAvailable);
        setEmployeeOldGroupId(fromAvailable.group_id);
        setShowWarning(true);
      } else {
        // Employee is not in any group or inactive in this group
        addMember(fromAvailable);
      }
    } else if (fromMembers && targetZone === 'available-zone') {
      // Removing employee from group
      removeMember(draggedId);
    }
  };

  // Add member
  const addMember = (employee: Employee) => {
    const newMember: GroupMember = {
      ...employee,
      role: 'member',
    };
    setMembers(prev => [...prev, newMember]);
  };

  // Remove member
  const removeMember = (employeeId: string) => {
    setMembers(prev => prev.filter(m => m.id !== employeeId));
  };

  // Cycle role
  const cycleRole = (employeeId: string) => {
    setMembers(prev => prev.map(member => {
      if (member.id === employeeId) {
        const roles: ('member' | 'lead' | 'admin')[] = ['member', 'lead', 'admin'];
        const currentIndex = roles.indexOf(member.role);
        const nextRole = roles[(currentIndex + 1) % roles.length];
        return { ...member, role: nextRole };
      }
      return member;
    }));
  };

  // Handle warning confirmation
  const handleWarningConfirm = () => {
    if (movingEmployee) {
      addMember(movingEmployee);
      setShowWarning(false);
      setMovingEmployee(null);
      // Keep employeeOldGroupId - will be used in handleSave to remove from old group
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!group) return;

    setSaving(true);
    try {
      // Use employee IDs for comparison (all members are now normalized to use employee ID)
      const originalEmployeeIds = new Set(normalizedCurrentMembers.map(m => m.id));
      const newEmployeeIds = new Set(members.map(m => m.id));

      // Find added members (those in current state but not in original)
      const addedMembers = members.filter(m => !originalEmployeeIds.has(m.id));

      // Find removed members (those in original but not in current state)
      // Map employee IDs back to membership IDs for removal
      const removedMemberIds = normalizedCurrentMembers
        .filter(m => !newEmployeeIds.has(m.id))
        .map(m => employeeIdToMembershipId.get(m.id) || m.membershipId || m.id);

      // Pass oldGroupId if this is a move operation (employee was moved from another group)
      await onSave(addedMembers, removedMemberIds, employeeOldGroupId);

      antMessage.success('Group members updated successfully');

      // Reset old group ID after successful save
      setEmployeeOldGroupId(null);
      onClose();
    } catch (error) {
      console.error('Failed to save members:', error);
      antMessage.error('Failed to update group members');
    } finally {
      setSaving(false);
    }
  };

  // Calculate changes
  const changesCount = useMemo(() => {
    const originalIds = new Set(normalizedCurrentMembers.map(m => m.id));
    const newIds = new Set(members.map(m => m.id));
    const added = members.filter(m => !originalIds.has(m.id)).length;
    const removed = normalizedCurrentMembers.filter(m => !newIds.has(m.id)).length;
    return { added, removed };
  }, [members, normalizedCurrentMembers]);

  return (
    <>
      <Modal
        title={<Space><TeamOutlined /> Manage Members: {group?.name}</Space>}
        open={visible}
        onCancel={onClose}
        width={1000}
        footer={[
          <Button key="cancel" onClick={onClose}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={saving}
            onClick={handleSave}
            disabled={changesCount.added === 0 && changesCount.removed === 0}
          >
            Save Changes {changesCount.added + changesCount.removed > 0 &&
              `(+${changesCount.added} / -${changesCount.removed})`}
          </Button>,
        ]}
      >
        <Alert
          title="Drag & Drop to Manage Members"
          description="Drag employee cards from left to right to add them to the group, or right to left to remove them. Click role badges to change member roles."
          type="info"
          showIcon
          icon={<SwapOutlined />}
          style={{ marginBottom: 16 }}
        />

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Available Employees Column */}
            <div style={{ flex: 1 }}>
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                <Text strong>Available Employees ({availableEmployees.length})</Text>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search employees..."
                  value={searchAvailable}
                  onChange={(e) => setSearchAvailable(e.target.value)}
                  allowClear
                />
                <DroppableZone
                  id="available-zone"
                  style={{
                    border: '2px dashed #d9d9d9',
                    borderRadius: 8,
                    padding: 16,
                    minHeight: 400,
                    maxHeight: 500,
                    overflowY: 'auto',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                    {availableEmployees.map(employee => (
                      <DraggableCard
                        key={employee.id}
                        employee={employee}
                        isAvailable={true}
                        isDragging={activeId === employee.id}
                      />
                    ))}
                    {availableEmployees.length === 0 && (
                      <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                        {searchAvailable ? 'No employees found' : 'All employees assigned'}
                      </Text>
                    )}
                  </Space>
                </DroppableZone>
              </Space>
            </div>

            {/* Group Members Column */}
            <div style={{ flex: 1 }}>
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                <Text strong>Group Members ({members.length})</Text>
                <Space>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search members..."
                    value={searchMembers}
                    onChange={(e) => setSearchMembers(e.target.value)}
                    allowClear
                    style={{ flex: 1 }}
                  />
                  <Select
                    value={roleFilter}
                    onChange={setRoleFilter}
                    style={{ width: 120 }}
                  >
                    <Select.Option value="all">All Roles</Select.Option>
                    <Select.Option value="admin">Admin</Select.Option>
                    <Select.Option value="lead">Lead</Select.Option>
                    <Select.Option value="member">Member</Select.Option>
                  </Select>
                </Space>
                <DroppableZone
                  id="members-zone"
                  style={{
                    border: '2px dashed #1890ff',
                    borderRadius: 8,
                    padding: 16,
                    minHeight: 400,
                    maxHeight: 500,
                    overflowY: 'auto',
                    backgroundColor: '#f0f7ff',
                  }}
                >
                  <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                    {filteredMembers.map(member => (
                      <DraggableCard
                        key={member.id}
                        employee={member}
                        isAvailable={false}
                        onRoleClick={() => cycleRole(member.id)}
                        isDragging={activeId === member.id}
                      />
                    ))}
                    {filteredMembers.length === 0 && (
                      <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                        {searchMembers || roleFilter !== 'all'
                          ? 'No members found'
                          : 'Drag employees here to add them'}
                      </Text>
                    )}
                  </Space>
                </DroppableZone>
              </Space>
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <div style={{ opacity: 0.9 }}>
                <DraggableCard
                  employee={
                    availableEmployees.find(e => e.id === activeId) ||
                    members.find(m => m.id === activeId)!
                  }
                  isAvailable={!!availableEmployees.find(e => e.id === activeId)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Inline styles for card */}
        <style>{`
          .employee-card {
            background: white;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            padding: 12px;
            cursor: grab;
            transition: all 0.2s;
          }
          .employee-card:hover {
            border-color: #1890ff;
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
          }
          .employee-card:active {
            cursor: grabbing;
          }
        `}</style>
      </Modal>

      {/* Warning Modal */}
      <Modal
        title={<Space><WarningOutlined style={{ color: '#fa8c16' }} /> Employee Already in Another Group</Space>}
        open={showWarning}
        onOk={handleWarningConfirm}
        onCancel={() => {
          setShowWarning(false);
          setMovingEmployee(null);
          setEmployeeOldGroupId(null);
        }}
        okText="Move Employee"
        okButtonProps={{ danger: true }}
      >
        {movingEmployee && (
          <>
            <p>
              <Text strong>{movingEmployee.employee_name || `${movingEmployee.first_name} ${movingEmployee.last_name}`}</Text> is currently in:
            </p>
            <Alert
              message={movingEmployee.group_name}
              description={`Role: ${movingEmployee.role?.toUpperCase()}`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <p>
              Moving to <Text strong>{group?.name}</Text> will remove them from{' '}
              <Text strong>{movingEmployee.group_name}</Text>.
            </p>
            <p>
              <Text type="secondary">Continue?</Text>
            </p>
          </>
        )}
      </Modal>
    </>
  );
};
