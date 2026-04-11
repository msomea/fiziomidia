import { useEffect, useState, useMemo } from "react";
import { Activity, Users, Calendar, TrendingUp } from "lucide-react";
import { useTranslation } from 'react-i18next'
import CollapsibleSection from "./CollapsibleSection";
import dayjs from "dayjs";
import { useDashboard } from "../../contexts/DashboardContext";

export default function AdminMonitoringSection() {
  const { t } = useTranslation()
  const { activityLogs, adminStats, refreshAdminStats, refreshActivityLogs, loading: dashboardLoading } = useDashboard();

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [adminFilter, setAdminFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const [showStats, setShowStats] = useState(false);

  // 🔥 Debounce search (performance boost)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // Only load logs when pagination changes, not on initial mount
    if (currentPage > 1) {
      loadLogs();
    }
  }, [currentPage]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      await refreshActivityLogs();
    } catch (error) {
      console.error("Failed to load admin logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Extract unique admins for dropdown
  const adminOptions = useMemo(() => {
    const map = new Map();

    if (Array.isArray(activityLogs)) {
      activityLogs.forEach((log) => {
        if (log.admin?._id) {
          map.set(log.admin._id, log.admin.fullName);
        }
      });
    }

    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [activityLogs]);

  // 🔥 Optimized filtering
  const filteredLogs = useMemo(() => {
    if (!Array.isArray(activityLogs)) {
      return [];
    }
    return activityLogs.filter((log) => {
      const matchesSearch =
        debouncedSearch === "" ||
        log.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.admin?.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesAction =
        actionFilter === "" || log.action === actionFilter;

      const matchesAdmin =
        adminFilter === "" || log.admin?._id === adminFilter;

      const matchesTarget =
        targetFilter === "" || log.targetType === targetFilter;

      const logDate = dayjs(log.createdAt);

      const matchesStartDate =
        !startDate || logDate.isAfter(dayjs(startDate).startOf("day"));

      const matchesEndDate =
        !endDate || logDate.isBefore(dayjs(endDate).endOf("day"));

      return (
        matchesSearch &&
        matchesAction &&
        matchesAdmin &&
        matchesTarget &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    activityLogs,
    debouncedSearch,
    actionFilter,
    adminFilter,
    targetFilter,
    startDate,
    endDate,
  ]);

  // 🔥 Pagination AFTER filtering
  const totalPages = Math.ceil(filteredLogs.length / postsPerPage);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * postsPerPage;
    return filteredLogs.slice(start, start + postsPerPage);
  }, [filteredLogs, currentPage]);

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
        {showStats && adminStats && adminStats.stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded">
            {/* Action Stats */}
            <div>
              <h3 className="font-semibold text-caribbean mb-2">{t('action_statistics')}</h3>
              <div className="space-y-1">
                {adminStats.stats.actionStats?.slice(0, 6).map((action) => (
                  <div key={action._id} className="flex justify-between text-sm">
                    <span>{formatAction(action._id)}</span>
                    <span className="font-medium">{action.count}</span>
                  </div>
                ))}
                {(!adminStats.stats.actionStats || adminStats.stats.actionStats.length === 0) && (
                  <div className="text-sm text-gray-500">{t('no_actions_found')}</div>
                )}
              </div>
            </div>

            {/* Admin Stats */}
            <div>
              <h3 className="font-semibold text-caribbean mb-2">{t('admin_activity')}</h3>
              <div className="space-y-1">
                {adminStats.stats.adminStats?.map((admin) => (
                  <div key={admin._id} className="flex justify-between text-sm">
                    <span>{admin.adminName}</span>
                    <span className="font-medium">{admin.count}</span>
                  </div>
                ))}
                {(!adminStats.stats.adminStats || adminStats.stats.adminStats.length === 0) && (
                  <div className="text-sm text-gray-500">{t('no_admin_activity')}</div>
                )}
              </div>
            </div>

            {/* Daily Stats */}
            <div>
              <h3 className="font-semibold text-caribbean mb-2">{t('daily_activity')}</h3>
              <div className="space-y-1">
                {adminStats.stats.dailyStats?.map((day) => (
                  <div key={`${day._id.year}-${day._id.month}-${day._id.day}`} className="flex justify-between text-sm">
                    <span>{dayjs(`${day._id.year}-${day._id.month}-${day._id.day}`).format('MMM DD, YYYY')}</span>
                    <span className="font-medium">{day.count}</span>
                  </div>
                ))}
                {(!adminStats.stats.dailyStats || adminStats.stats.dailyStats.length === 0) && (
                  <div className="text-sm text-gray-500">{t('no_daily_activity')}</div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* Search */}
          <input
            type="text"
            placeholder={t('search_activities')}
            className="border p-2 rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Admin Filter */}
          <select
            className="border p-2 rounded"
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
          >
            <option value="">{t('all_admins')}</option>
            {adminOptions.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>

          {/* Action Filter */}
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

          {/* Target Filter */}
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

          {/* Dates */}
          <div className="flex gap-2">
            <input
              type="date"
              className="border p-2 rounded flex-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="border p-2 rounded flex-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Logs */}
        <div className="border rounded">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('no_activities_found')}
            </div>
          ) : (
            <div className="divide-y">
              {paginatedLogs.map((log) => (
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

        {/* Pagination */}
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