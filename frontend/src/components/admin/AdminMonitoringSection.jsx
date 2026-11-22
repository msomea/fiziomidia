import { useEffect, useState, useMemo } from "react";
import { Activity, Users, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { useTranslation } from 'react-i18next'
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import dayjs from "dayjs";
import { useDashboard } from "../../contexts/DashboardContext";
import { performUnifiedSearch } from "../../api/admin";

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

  const [showStats, setShowStats] = useState(false);
  const [searchedLogs, setSearchedLogs] = useState([]);

  // Debounce search (performance boost)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const result = await performUnifiedSearch({
        types: ['activity-logs'],
        search: debouncedSearch,
        filters: {
          admin: adminFilter,
          action: actionFilter,
          targetType: targetFilter
        },
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      setSearchedLogs(result.activityLogs || []);
    } catch (error) {
      console.error('Failed to load activity logs via unified search:', error);
    } finally {
      setLoading(false);
    }
  };

  const reload = () => {
    loadActivityLogs();
    refreshAdminStats();
    refreshActivityLogs();
  };

  useEffect(() => {
    // Load logs on mount and whenever server-side filters change
    loadActivityLogs();
  }, [debouncedSearch, adminFilter, actionFilter, targetFilter]);

  // Extract unique admins for dropdown
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

  const filteredLogs = useMemo(() => {
    const sourceLogs = searchedLogs;
    if (!Array.isArray(sourceLogs)) {
      return [];
    }
    return sourceLogs.filter((log) => {
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
    searchedLogs,
    debouncedSearch,
    actionFilter,
    adminFilter,
    targetFilter,
    startDate,
    endDate,
  ]);

  // Stats derived from the activity logs dataset in context
  const stats = useMemo(() => {
    const source = Array.isArray(activityLogs) ? activityLogs : [];
    const today = dayjs().format("YYYY-MM-DD");
    const uniqueAdmins = new Set(source.map((l) => l.admin?._id).filter(Boolean)).size;
    const uniqueActions = new Set(source.map((l) => l.action).filter(Boolean)).size;
    return {
      total: source.length,
      today: source.filter((l) => dayjs(l.createdAt).format("YYYY-MM-DD") === today).length,
      admins: uniqueAdmins,
      actions: uniqueActions,
    };
  }, [activityLogs]);

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
      'EDUCATION_RESOURCE_APPROVED': <Activity className="w-4 h-4 text-green-600" />,
      'EDUCATION_RESOURCE_REJECTED': <Activity className="w-4 h-4 text-red-600" />,
      'EDUCATION_RESOURCE_SUSPENDED': <Activity className="w-4 h-4 text-amber-600" />,
      'EDUCATION_RESOURCE_REMOVED': <Activity className="w-4 h-4 text-red-700" />,
      'EDUCATION_RESOURCE_RESTORED': <Activity className="w-4 h-4 text-green-600" />,
      'EDUCATION_DOWNLOAD_HOLD_SET': <Activity className="w-4 h-4 text-amber-600" />,
      'EDUCATION_DOWNLOAD_HOLD_RELEASED': <Activity className="w-4 h-4 text-blue-600" />,
      'EDUCATION_REPORT_UPDATED': <Activity className="w-4 h-4 text-purple-600" />,
      'EDUCATION_REQUEST_UPDATED': <Activity className="w-4 h-4 text-teal-600" />,
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
      'EDUCATION_RESOURCE_APPROVED': 'text-green-600',
      'EDUCATION_RESOURCE_REJECTED': 'text-red-600',
      'EDUCATION_RESOURCE_SUSPENDED': 'text-amber-600',
      'EDUCATION_RESOURCE_REMOVED': 'text-red-700',
      'EDUCATION_RESOURCE_RESTORED': 'text-green-600',
      'EDUCATION_DOWNLOAD_HOLD_SET': 'text-amber-600',
      'EDUCATION_DOWNLOAD_HOLD_RELEASED': 'text-blue-600',
      'EDUCATION_REPORT_UPDATED': 'text-purple-600',
      'EDUCATION_REQUEST_UPDATED': 'text-teal-600',
    };
    return colorMap[action] || 'text-gray-600';
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const isLoading = dashboardLoading || loading;
  return (
    <CollapsibleSection title={t('admin_monitoring')}>
      <div className="flex justify-end mb-3">
        <button onClick={reload} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            ["stat_total", stats.total],
            ["stat_today", stats.today],
            ["admins", stats.admins],
            ["actions", stats.actions],
          ].map(([key, val]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{val}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stats Toggle */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowStats(!showStats)}
          className="btn btn-xs btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          {showStats ? t('hide_stats') : t('show_stats')}
        </button>
      </div>

      {/* Stats Panel */}
      {showStats && adminStats && adminStats.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">

        {/* Search */}
        <input
          type="text"
          placeholder={t('search_activities')}
          className="input input-bordered input-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Admin Filter */}
        <select
          className="select select-bordered select-xs"
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
          className="select select-bordered select-xs"
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
          <option value="EDUCATION_RESOURCE_APPROVED">{t('education_resource_approved')}</option>
          <option value="EDUCATION_RESOURCE_REJECTED">{t('education_resource_rejected')}</option>
          <option value="EDUCATION_RESOURCE_SUSPENDED">{t('education_resource_suspended')}</option>
          <option value="EDUCATION_RESOURCE_REMOVED">{t('education_resource_removed')}</option>
          <option value="EDUCATION_RESOURCE_RESTORED">{t('education_resource_restored')}</option>
          <option value="EDUCATION_DOWNLOAD_HOLD_SET">{t('education_download_hold_set')}</option>
          <option value="EDUCATION_DOWNLOAD_HOLD_RELEASED">{t('education_download_hold_released')}</option>
          <option value="EDUCATION_REPORT_UPDATED">{t('education_report_updated')}</option>
          <option value="EDUCATION_REQUEST_UPDATED">{t('education_request_updated')}</option>
        </select>

        {/* Target Filter */}
        <select
          className="select select-bordered select-xs"
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
        >
          <option value="">{t('all_targets')}</option>
          <option value="User">{t('users')}</option>
          <option value="Appointment">{t('appointments')}</option>
          <option value="Promotion">{t('promotions')}</option>
          <option value="SponsoredProduct">{t('products')}</option>
          <option value="EducationResource">{t('education_resources')}</option>
          <option value="CopyrightReport">{t('copyright_reports')}</option>
          <option value="ResourceRequest">{t('resource_requests')}</option>
        </select>

        {/* Dates */}
        <div className="flex gap-2">
          <input
            type="date"
            className="input input-bordered input-xs flex-1"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="input input-bordered input-xs flex-1"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Logs */}
      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : filteredLogs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          {t('no_activities_found')}
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log._id} className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <div className={getActionColor(log.action)}>
                  {getActionIcon(log.action)}
                </div>

                <div className="flex-1 min-w-0">
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
    </CollapsibleSection>
  );
}
