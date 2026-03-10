import { useEffect, useState } from "react";
import { Search, Filter, Activity, Users, Calendar, TrendingUp } from "lucide-react";
import { useTranslation } from 'react-i18next'
import CollapsibleSection from "./CollapsibleSection";
import dayjs from "dayjs";
import { useDashboard } from "../../contexts/DashboardContext";

export default function AdminMonitoringSection() {
  const { t } = useTranslation()
  const { activityLogs, adminStats, refreshAdminStats, loading: dashboardLoading } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Only refresh if filters change and we have initial data
    if (activityLogs.length > 0) {
      loadLogs();
    }
  }, [currentPage, adminFilter, actionFilter, targetFilter, startDate, endDate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      await refreshAdminStats();
      // Note: For detailed filtering, we'd need to update the context to handle filtered logs
      setTotalPages(1); // Simplified for dashboard preview
    } catch (error) {
      console.error("Failed to load admin logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const iconMap = {
      'USER_ROLE_UPDATED': <Users className="w-4 h-4" />,
      'LICENSE_VERIFIED': <Activity className="w-4 h-4 text-green-600" />,
      'LICENSE_REJECTED': <Activity className="w-4 h-4 text-red-600" />,
      'APPOINTMENT_UPDATED': <Calendar className="w-4 h-4 text-blue-600" />,
      'APPOINTMENT_DELETED': <Calendar className="w-4 h-4 text-red-600" />,
      'PROMOTION_UPDATED': <TrendingUp className="w-4 h-4 text-purple-600" />,
      'PROMOTION_DELETED': <TrendingUp className="w-4 h-4 text-red-600" />,
      'SPONSORSHIP_UPDATED': <Activity className="w-4 h-4 text-orange-600" />,
      'PRODUCT_CREATED': <TrendingUp className="w-4 h-4 text-green-600" />,
      'PRODUCT_UPDATED': <TrendingUp className="w-4 h-4 text-blue-600" />,
      'PRODUCT_DELETED': <TrendingUp className="w-4 h-4 text-red-600" />,
      'EMAIL_SENT': <Activity className="w-4 h-4 text-indigo-600" />,
    };
    return iconMap[action] || <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action) => {
    const colorMap = {
      'USER_ROLE_UPDATED': 'text-blue-600',
      'LICENSE_VERIFIED': 'text-green-600',
      'LICENSE_REJECTED': 'text-red-600',
      'APPOINTMENT_UPDATED': 'text-blue-600',
      'APPOINTMENT_DELETED': 'text-red-600',
      'PROMOTION_UPDATED': 'text-purple-600',
      'PROMOTION_DELETED': 'text-red-600',
      'SPONSORSHIP_UPDATED': 'text-orange-600',
      'PRODUCT_CREATED': 'text-green-600',
      'PRODUCT_UPDATED': 'text-blue-600',
      'PRODUCT_DELETED': 'text-red-600',
      'EMAIL_SENT': 'text-indigo-600',
    };
    return colorMap[action] || 'text-gray-600';
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Use dashboard loading state for initial load, local loading for refreshes
  const isLoading = dashboardLoading || loading;

  return (
    <CollapsibleSection title={t('admin_monitoring')}>
      <div className="space-y-4 text-tufts">
        {/* Stats Toggle */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2 bg-caribbean text-white rounded hover:bg-caribbean-dark"
          >
            <Activity className="w-4 h-4" />
            {showStats ? t('hide_stats') : t('show_stats')}
          </button>
        </div>

        {/* Stats Panel */}
        {showStats && adminStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded">
            {/* Basic Counts */}
            <div>
              <h3 className="font-semibold text-caribbean mb-2">{t('system_overview')}</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{t('users')}</span>
                  <span className="font-medium">{adminStats.userCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('appointments')}</span>
                  <span className="font-medium">{adminStats.appointmentCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('promotions')}</span>
                  <span className="font-medium">{adminStats.promotionCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Product & Sponsorship Stats */}
            <div>
              <h3 className="font-semibold text-caribbean mb-2">{t('content_overview')}</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{t('products')}</span>
                  <span className="font-medium">{adminStats.productCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('sponsored_subs')}</span>
                  <span className="font-medium">{adminStats.sponsoredSubCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('recent_activity')}</span>
                  <span className="font-medium">{adminStats.recentActivity || 0}</span>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div>
              <h3 className="font-semibold text-caribbean mb-2">{t('data_status')}</h3>
              <div className="text-sm text-gray-600">
                <p>{t('last_updated')}: {dayjs(adminStats.lastUpdated).format('HH:mm:ss')}</p>
                {adminStats.error && (
                  <p className="text-red-600 text-xs mt-1">{adminStats.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder={t('search_activities')}
            className="border p-2 rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border p-2 rounded"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">{t('all_actions')}</option>
            <option value="USER_ROLE_UPDATED">{t('user_role_updates')}</option>
            <option value="LICENSE_VERIFIED">{t('license_verified')}</option>
            <option value="LICENSE_REJECTED">{t('license_rejected')}</option>
            <option value="APPOINTMENT_UPDATED">{t('appointment_updates')}</option>
            <option value="PROMOTION_UPDATED">{t('promotion_updates')}</option>
            <option value="PRODUCT_CREATED">{t('product_created')}</option>
            <option value="EMAIL_SENT">{t('emails_sent')}</option>
          </select>

          <select
            className="border p-2 rounded"
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
          >
            <option value="">{t('all_targets')}</option>
            <option value="User">{t('users')}</option>
            <option value="Appointment">{t('appointments')}</option>
            <option value="Promotion">{t('promotions')}</option>
            <option value="SponsoredProduct">{t('products')}</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              className="border p-2 rounded flex-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder={t('start_date')}
            />
            <input
              type="date"
              className="border p-2 rounded flex-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder={t('end_date')}
            />
          </div>
        </div>

        {/* Activity Logs */}
        <div className="border rounded">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean mx-auto mb-2"></div>
              {t('loading_activities')}
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('no_activities_found')}
            </div>
          ) : (
            <div className="divide-y">
              {activityLogs.slice(0, 10).map((log) => (
                <div key={log._id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={getActionColor(log.action)}>
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {dayjs(log.createdAt).format('MMM DD, YYYY HH:mm')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">{log.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {t('by')}: <strong>{log.admin?.fullName || 'Unknown'}</strong>
                        </span>
                        {log.targetType && (
                          <span>
                            {t('target')}: <strong>{log.targetType}</strong>
                          </span>
                        )}
                        {log.ipAddress && (
                          <span>
                            IP: <strong>{log.ipAddress}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination - simplified for dashboard preview */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {t('previous')}
            </button>
            <span className="text-sm">
              {t('page')} {currentPage} {t('of')} {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
