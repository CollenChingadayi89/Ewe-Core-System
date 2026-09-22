import { useState, useEffect } from 'react';
import {
  Dropdown,
  Badge,
  Button,
  List,
  Typography,
  Space,
  Empty,
  Tag,
  Spin,
  Divider,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useApprovalNotificationStore } from '../../store/approvalNotificationStore';
import type { ApprovalNotification } from '../../store/approvalNotificationStore';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
  } = useApprovalNotificationStore();

  // Start polling when component mounts, stop when unmounts
  useEffect(() => {
    startPolling(30000); // Poll every 30 seconds
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      fetchNotifications({ page: 1 });
    }
  }, [dropdownOpen, fetchNotifications]);

  const handleNotificationClick = async (notification: ApprovalNotification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setDropdownOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: ApprovalNotification['type']) => {
    const iconStyle = { fontSize: '18px' };
    switch (type) {
      case 'approved':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'rejected':
        return <CloseCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      case 'approval_required':
        return <ClockCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'escalated':
      case 'reminder':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#fa8c16' }} />;
      default:
        return <BellOutlined style={{ ...iconStyle, color: '#8c8c8c' }} />;
    }
  };

  const getPriorityColor = (priority: ApprovalNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const dropdownContent = (
    <div
      style={{
        width: 420,
        maxHeight: 600,
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Notifications
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </Text>
        </div>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div
        style={{
          maxHeight: 480,
          overflowY: 'auto',
        }}
      >
        {loading && notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ padding: '40px' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  background: notification.isRead ? 'white' : '#f0f9ff',
                  borderLeft: notification.isRead
                    ? 'none'
                    : '3px solid #1890ff',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleNotificationClick(notification)}
                className="notification-item"
              >
                <div style={{ width: '100%' }}>
                  <Space align="start" style={{ width: '100%' }}>
                    <div style={{ marginTop: '4px' }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <Text
                          strong={!notification.isRead}
                          style={{ fontSize: '14px' }}
                        >
                          {notification.title}
                        </Text>
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => handleDelete(notification.id, e)}
                          style={{ marginLeft: '8px' }}
                        />
                      </div>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: '13px',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        {notification.message}
                      </Text>
                      <Space size="small">
                        <Text
                          type="secondary"
                          style={{ fontSize: '12px' }}
                        >
                          {dayjs(notification.createdAt).fromNow()}
                        </Text>
                        {notification.priority !== 'low' && (
                          <Tag
                            color={getPriorityColor(notification.priority)}
                            style={{ fontSize: '11px', marginLeft: '4px' }}
                          >
                            {notification.priority.toUpperCase()}
                          </Tag>
                        )}
                      </Space>
                    </div>
                  </Space>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div
            style={{
              padding: '12px 20px',
              textAlign: 'center',
            }}
          >
            <Button
              type="link"
              onClick={() => {
                navigate('/approvals');
                setDropdownOpen(false);
              }}
            >
              View all approvals
            </Button>
          </div>
        </>
      )}

      {/* Custom Styles */}
      <style>
        {`
          .notification-item:hover {
            background: #f5f5f5 !important;
          }
        `}
      </style>
    </div>
  );

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      popupRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-4, 4]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: '20px', color: '#32373c' }} />}
          style={{
            width: 48,
            height: 48,
            borderRadius: '8px',
            transition: 'all 0.3s',
          }}
          className="header-action-btn"
        />
      </Badge>
    </Dropdown>
  );
};
