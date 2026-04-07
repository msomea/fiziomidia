import React from "react";
import { useTranslation } from "react-i18next";

/**
 * NotificationSection - Reusable notification component for PT and Member dashboards
 * 
 * Notification Levels:
 * - critical: Red - Requires immediate action (e.g., license rejected, account suspended)
 * - important: Orange - Requires action (e.g., new appointment, setup working hours)
 * - update: Blue - Status changes (e.g., appointment updates, clinic invitations)
 * - information: Gray - General information (e.g., welcome messages, general updates)
 * 
 * Usage:
 * <NotificationSection 
 *   notifications={notifications}
 *   markNotificationRead={markNotificationRead}
 *   userId={user._id}
 * />
 */
export default function NotificationSection({ notifications, markNotificationRead, userId }) {
  const { t } = useTranslation();
  console.log("Notifications in NotificationSection", notifications);

  // Notification level configurations
  const notificationLevels = {
    critical: {
      color: 'border-red-500 bg-red-50',
      bgColor: 'bg-red-500',
      icon: (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-.084 1.522-.267 2.094-.267.572.042.838.13 1.532.267 2.094-.267.572-.042.838-.13 1.532-.267 2.094-.267.572-.042-.838-.13-1.532-.267-2.094.267-.572.042-.838.13-1.532.267-2.094.267-.572.042.838.13zM8.257 3.099c-.765.084-1.522.267-2.094.267-.572-.042-.838-.13-1.532-.267-2.094.267-.572.042-.838-.13-1.532.267-2.094.267-.572.042-.838.13zM1 13a1 1 0 100-2 0 0 0 1 1 0 0 1 0zm2 4a1 1 0 102 0 0 0 1 1 0zm0 2h14a1 1 0 102 0 0 0-1 1 0zm-7 4a1 1 0 102 0 0 0-1 1 0zm7 4a1 1 0 102 0 0 0 1 1 0z" clipRule="evenodd"/>
        </svg>
      )
    },
    important: {
      color: 'border-orange-500 bg-orange-50',
      bgColor: 'bg-orange-500',
      icon: (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-.084 1.522-.267 2.094-.267.572.042.838.13 1.532.267 2.094-.267.572-.042.838-.13 1.532-.267 2.094-.267.572-.042-.838-.13-1.532-.267-2.094.267-.572.042-.838.13-1.532.267-2.094.267-.572.042.838.13zM8.257 3.099c-.765.084-1.522.267-2.094.267-.572-.042-.838-.13-1.532-.267-2.094.267-.572.042-.838-.13-1.532.267-2.094.267-.572.042-.838.13zM1 13a1 1 0 100-2 0 0 0 1 1 0 0 1 0zm2 4a1 1 0 102 0 0 0 1 1 0zm0 2h14a1 1 0 102 0 0 0-1 1 0zm-7 4a1 1 0 102 0 0 0-1 1 0zm7 4a1 1 0 102 0 0 0 1 1 0z" clipRule="evenodd"/>
        </svg>
      )
    },
    update: {
      color: 'border-blue-500 bg-blue-50',
      bgColor: 'bg-blue-500',
      icon: (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
        </svg>
      )
    },
    information: {
      color: 'border-gray-500 bg-gray-50',
      bgColor: 'bg-gray-500',
      icon: (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
        </svg>
      )
    }
  };

  // Map notification types to levels
  const getNotificationLevel = (notification) => {
    const { type, priority } = notification;
    
    // If notification has explicit priority, use it
    if (priority) {
      return priority;
    }
    
    // Default level mapping for common notification types
    switch (type) {
      // Critical - requires immediate action
      case 'license_rejected':
      case 'mod_request_rejected':
      case 'account_suspended':
      case 'payment_failed':
        return 'critical';
      
      // Important - requires action
      case 'license_accepted':
      case 'mod_request_accepted':
      case 'new_appointment':
      case 'appointment_update':
      case 'clinic_request_accepted':
      case 'clinic_request_rejected':
      case 'setup_working_hours':
        return 'important';
      
      // Update - status changes
      case 'appointment_status_update':
      case 'clinic_invitation':
      case 'clinic_invitation_cancelled':
      case 'mod_request_new':
        return 'update';
      
      // Information - general info
      default:
        return 'information';
    }
  };

  const getNotificationIcon = (level) => {
    return notificationLevels[level]?.icon || notificationLevels.information.icon;
  };

  const getNotificationColor = (level) => {
    return notificationLevels[level]?.color || notificationLevels.information.color;
  };

  const getNotificationBgColor = (level) => {
    return notificationLevels[level]?.bgColor || notificationLevels.information.bgColor;
  };

  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-black mb-3">
          {t('notifications')}
        </h2>
        <div className="text-center text-gray-500 py-4">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
          </svg>
          <p className="text-sm">{t('no_notifications')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-black mb-3 flex items-center justify-between">
        {t('notifications')}
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {Array.isArray(notifications) ? notifications.length : 0}
        </span>
      </h2>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {Array.isArray(notifications) && notifications.slice(0, 5).map((notification) => {
          const level = getNotificationLevel(notification);
          return (
            <div 
              key={notification._id}
              className={`p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-80 transition-opacity ${getNotificationColor(level)}`}
              onClick={() => markNotificationRead && markNotificationRead(userId, notification._id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${getNotificationBgColor(level)} rounded-full flex items-center justify-center`}>
                    {getNotificationIcon(level)}
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {Array.isArray(notifications) && notifications.length > 5 && (
        <div className="mt-3 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            {t('view_all_notifications')}
          </button>
        </div>
      )}
    </div>
  );
}
