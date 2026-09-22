import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, theme, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CarOutlined,
  ToolOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LaptopOutlined,
  UsergroupAddOutlined,
  FileOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { isManager } from '../routes/RoleBasedRoute';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useApprovalStore } from '../store/approvalStore';
import { NotificationDropdown } from '../components/layout/NotificationDropdown';
import ewesaccoLogo from '../assets/ewe-sacco-logo.png';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const pendingCount = useApprovalStore((state) => state.pendingCount);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ];

  // Role-aware menu items
  const getMenuItems = (): MenuProps['items'] => {
    const userIsManager = user && isManager(user.role);

    // Employee menu - shown to all users
    const employeeMenuItems: MenuProps['items'] = [
      {
        key: '/employee/dashboard',
        icon: <DashboardOutlined />,
        label: 'My Dashboard',
        onClick: () => navigate('/employee/dashboard'),
      },
      {
        key: '/employee/requests',
        icon: <InboxOutlined />,
        label: 'My Requests',
        onClick: () => navigate('/employee/requests'),
      },
      {
        key: '/employee/leaves',
        icon: <CalendarOutlined />,
        label: 'My Leaves',
        onClick: () => navigate('/employee/leaves'),
      },
      {
        key: '/employee/attendance',
        icon: <ClockCircleOutlined />,
        label: 'My Attendance',
        onClick: () => navigate('/employee/attendance'),
      },
      {
        key: '/employee/petty-cash',
        icon: <DollarOutlined />,
        label: 'My Petty Cash',
        onClick: () => navigate('/employee/petty-cash'),
      },
      {
        key: '/employee/assets',
        icon: <LaptopOutlined />,
        label: 'My Assets',
        onClick: () => navigate('/employee/assets'),
      },
      {
        key: '/employee/directory',
        icon: <UsergroupAddOutlined />,
        label: 'Team Directory',
        onClick: () => navigate('/employee/directory'),
      },
      {
        key: '/employee/documents',
        icon: <FileOutlined />,
        label: 'My Documents',
        onClick: () => navigate('/employee/documents'),
      },
    ];

    // Manager menu - only shown to managers and above
    const managerMenuItems: MenuProps['items'] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/dashboard'),
      },
      {
        key: '/approvals',
        icon: <CheckSquareOutlined />,
        label: (
          <span>
            My Approvals
            {pendingCount > 0 && (
              <Badge
                count={pendingCount}
                style={{ marginLeft: '8px' }}
              />
            )}
          </span>
        ),
        onClick: () => navigate('/approvals'),
      },
      {
        type: 'divider',
      },
      {
        key: 'hr',
        icon: <TeamOutlined />,
        label: 'Human Resources',
        children: [
          {
            key: '/hr/employees',
            label: 'Employees',
            onClick: () => navigate('/hr/employees'),
          },
          {
            key: '/hr/departments',
            label: 'Departments',
            onClick: () => navigate('/hr/departments'),
          },
          {
            key: '/hr/leaves',
            label: 'Leave Management',
            onClick: () => navigate('/hr/leaves'),
          },
          {
            key: '/hr/leave-calendar',
            label: 'Leave Calendar',
            onClick: () => navigate('/hr/leave-calendar'),
          },
          {
            key: '/hr/leave-balances',
            label: 'Leave Balances',
            onClick: () => navigate('/hr/leave-balances'),
          },
          {
            key: '/hr/approval-workflows',
            label: 'Approval Workflows',
            onClick: () => navigate('/hr/approval-workflows'),
          },
          {
            key: '/hr/leave-settings',
            label: 'Leave Settings',
            onClick: () => navigate('/hr/leave-settings'),
          },
          {
            key: '/hr/attendance',
            label: 'Attendance',
            onClick: () => navigate('/hr/attendance'),
          },
          {
            key: '/hr/onboarding',
            label: 'Onboarding',
            onClick: () => navigate('/hr/onboarding'),
          },
        ],
      },
      {
        key: 'finance',
        icon: <DollarOutlined />,
        label: 'Finance',
        children: [
          {
            key: '/finance/receivables',
            label: 'Receivables Management',
            onClick: () => navigate('/finance/receivables'),
          },
          {
            key: '/finance/receivables/calendar',
            label: 'Receivables Calendar',
            onClick: () => navigate('/finance/receivables/calendar'),
          },
          {
            key: '/finance/payables',
            label: 'Payables Management',
            onClick: () => navigate('/finance/payables'),
          },
          {
            key: '/finance/payables/calendar',
            label: 'Payables Calendar',
            onClick: () => navigate('/finance/payables/calendar'),
          },
          {
            key: '/finance/petty-cash',
            label: 'Petty Cash',
            onClick: () => navigate('/finance/petty-cash'),
          },
          {
            key: '/finance/expenses',
            label: 'Expense Reimbursement',
            onClick: () => navigate('/finance/expenses'),
          },
          {
            key: '/finance/procurement',
            label: 'Procurement',
            onClick: () => navigate('/finance/procurement'),
          },
          {
            type: 'divider',
          },
          {
            key: '/finance/settings',
            label: 'Finance Settings',
            icon: <SettingOutlined />,
            onClick: () => navigate('/finance/settings'),
          },
        ],
      },
      {
        key: 'assets',
        icon: <ToolOutlined />,
        label: 'Assets & Facilities',
        children: [
          {
            key: '/assets/asset-manager',
            label: 'Asset Manager',
            onClick: () => navigate('/assets/asset-manager'),
          },
          {
            key: '/assets/fleet',
            label: 'Fleet Management',
            onClick: () => navigate('/assets/fleet'),
          },
        ],
      },
      {
        key: 'documents',
        icon: <FileOutlined />,
        label: 'Document Management',
        children: [
          {
            key: '/documents/all',
            label: 'All Documents',
            onClick: () => navigate('/documents/all'),
          },
        ],
      },
      {
        key: 'reports',
        icon: <BarChartOutlined />,
        label: 'Reports & Analytics',
        children: [
          {
            key: '/reports/dashboard',
            label: 'Reports Dashboard',
            onClick: () => navigate('/reports/dashboard'),
          },
        ],
      },
    ];

    // Return appropriate menu based on role
    return userIsManager ? managerMenuItems : employeeMenuItems;
  };

  const menuItems = getMenuItems();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#32373c',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #32373c 0%, #00d084 100%)',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <img
            src={ewesaccoLogo}
            alt="EWE SACCO Logo"
            style={{
              maxHeight: collapsed ? '56px' : '76px',
              maxWidth: '100%',
              objectFit: 'contain',
              transition: 'all 0.2s',
            }}
          />
        </div>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
            marginTop: '8px',
          }}
          className="custom-menu"
        />

        {/* User Info in Sidebar (when not collapsed) */}
        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px',
              background: 'rgba(0,0,0,0.2)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar
                size={40}
                icon={<UserOutlined />}
                src={user?.avatar}
                style={{ background: '#00d084', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name}
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.position}
                </div>
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 32px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            borderBottom: '1px solid #e8e8e8',
            height: '72px',
          }}
        >
          {/* Left Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '18px',
                width: 48,
                height: 48,
                borderRadius: '8px',
                transition: 'all 0.3s',
                color: '#32373c',
              }}
              className="menu-toggle-btn"
            />

            {/* Page Title or Breadcrumb can go here */}
            <div>
              <Text
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#32373c',
                  display: 'block',
                }}
              >
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/employee/dashboard' && 'My Dashboard'}
                {location.pathname === '/approvals' && 'My Approvals'}
                {location.pathname === '/employee/requests' && 'My Requests'}
                {location.pathname === '/employee/leaves' && 'My Leaves'}
                {location.pathname === '/employee/attendance' && 'My Attendance'}
                {location.pathname === '/employee/petty-cash' && 'My Petty Cash'}
                {location.pathname === '/employee/assets' && 'My Assets'}
                {location.pathname === '/employee/directory' && 'Team Directory'}
                {location.pathname.startsWith('/hr') && 'Human Resources'}
                {location.pathname.startsWith('/finance') && 'Finance'}
                {location.pathname.startsWith('/assets') && 'Assets & Facilities'}
                {location.pathname === '/profile' && 'Profile'}
                {location.pathname === '/settings' && 'Settings'}
              </Text>
            </div>
          </div>

          {/* Right Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notifications */}
            <NotificationDropdown />

            {/* User Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: '12px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  background: 'white',
                  border: '1px solid #e8e8e8',
                }}
                className="user-dropdown"
              >
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  style={{ background: '#00d084' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: '14px', color: '#32373c' }}>
                    {user?.name?.split(' ')[0]}
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>{user?.position}</Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: '24px 24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* Custom Styles */}
      <style>
        {`
          /* Custom Menu Styles */
          .custom-menu .ant-menu-item-selected {
            background: linear-gradient(90deg, #00d084 0%, rgba(0,208,132,0.1) 100%) !important;
            border-left: 3px solid #00d084;
          }

          .custom-menu .ant-menu-item:hover,
          .custom-menu .ant-menu-submenu-title:hover {
            background: rgba(0,208,132,0.1) !important;
          }

          .custom-menu .ant-menu-item,
          .custom-menu .ant-menu-submenu-title {
            margin: 4px 8px;
            border-radius: 6px;
            padding-left: 20px !important;
          }

          .custom-menu .ant-menu-submenu-selected > .ant-menu-submenu-title {
            color: #00d084 !important;
          }

          /* Header Action Buttons Hover */
          .header-action-btn:hover {
            background: rgba(0,208,132,0.1) !important;
          }

          .menu-toggle-btn:hover {
            background: rgba(0,208,132,0.1) !important;
          }

          .user-dropdown:hover {
            background: #f5f5f5 !important;
            border-color: #00d084 !important;
          }

          /* Badge Styles */
          .ant-badge-count {
            background: #ff6900 !important;
            box-shadow: 0 0 0 2px #32373c;
          }

          /* Scrollbar for Sidebar */
          .ant-layout-sider::-webkit-scrollbar {
            width: 6px;
          }

          .ant-layout-sider::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.1);
          }

          .ant-layout-sider::-webkit-scrollbar-thumb {
            background: rgba(0,208,132,0.5);
            border-radius: 3px;
          }

          .ant-layout-sider::-webkit-scrollbar-thumb:hover {
            background: #00d084;
          }
        `}
      </style>
    </Layout>
  );
};