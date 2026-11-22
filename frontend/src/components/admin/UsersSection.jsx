import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Search, RefreshCw } from "lucide-react";
import { useTranslation } from 'react-i18next'
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import { Link } from "react-router";
import { useDashboard } from "../../contexts/DashboardContext";
import { performUnifiedSearch } from "../../api/admin";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const { t } = useTranslation()
  const { users, refreshUsers, loading: dashboardLoading } = useDashboard();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);

  // Debounced search function using unified search
  const debouncedLoadUsers = useCallback((filters) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const result = await performUnifiedSearch({
          types: ['users'],
          search: filters.search,
          filters: {
            role: filters.role,
            licenseStatus: filters.licenseStatus
          },
          limit: 50
        });
        setAllUsers(result.users || []);
      } catch (error) {
        console.error('Failed to load users via unified search:', error);
        toast.error(t("failed_load_users"));
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce delay
  }, [t]);

  // Load users function for manual refresh
  const loadUsers = useCallback(async () => {
    const filters = {
      search,
      role: roleFilter,
      licenseStatus: licenseFilter,
    };

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    try {
      setLoading(true);
      await refreshUsers(filters);
    } catch (error) {
      console.error('Failed to refresh users:', error);
      toast.error(t("failed_load_users"));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, licenseFilter, refreshUsers, t]);

  // Store all users when they change
  useEffect(() => {
    if (users && users.length > 0) {
      setAllUsers(users);
    }
  }, [users]);

  // Real-time search effect
  useEffect(() => {
    const filters = {
      search,
      role: roleFilter,
      licenseStatus: licenseFilter,
    };

    // Trigger server-side search with debounce
    debouncedLoadUsers(filters);

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [search, roleFilter, licenseFilter, debouncedLoadUsers]);

  // Initial load
  useEffect(() => {
    loadUsers();
  }, []);

  // Client-side filtering function
  const filteredUsers = allUsers.filter((user) => {
    // Search filter (case-insensitive search on fullName and email)
    const matchesSearch = !search ||
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    // Role filter
    const matchesRole = !roleFilter || user.role === roleFilter;

    // License filter
    const license = user?.ptProfile?.licenses?.[0];
    const matchesLicense = !licenseFilter ||
      (license?.verificationStatus === licenseFilter);

    return matchesSearch && matchesRole && matchesLicense;
  });

  // Stats derived from loaded users
  const stats = useMemo(() => {
    const pts = allUsers.filter((u) => u.role === "physiotherapist").length;
    const pendingPts = allUsers.filter((u) => u.role === "pendingPhysiotherapist").length;
    const members = allUsers.filter((u) => u.role === "member").length;
    const admins = allUsers.filter((u) => u.role === "admin").length;
    const licensesPending = allUsers.filter(
      (u) => u?.ptProfile?.licenses?.[0]?.verificationStatus === "pending"
    ).length;
    return { total: allUsers.length, pts, pendingPts, members, admins, licensesPending };
  }, [allUsers]);

  // Use dashboard loading state for initial load, local loading for refreshes
  const isLoading = dashboardLoading || loading;
  const displayUsers = filteredUsers;

  return (
    <CollapsibleSection title={t('users_management')}>
      <div className="flex justify-end mb-3">
        <button onClick={loadUsers} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {allUsers.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {[
            ["stat_total", stats.total],
            ["physiotherapists", stats.pts],
            ["pending_pt_request", stats.pendingPts],
            ["members", stats.members],
            ["admins", stats.admins],
            ["pending_verification", stats.licensesPending],
          ].map(([key, val]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{val}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder_users')}
              className="input input-bordered input-xs w-full pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setLicenseFilter("");
            }}
            className="btn btn-xs btn-outline border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white"
          >
            {t("filter_all")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            className="select select-bordered select-xs"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">{t('all_roles')}</option>
            <option value="physiotherapist">{t('physiotherapists')}</option>
            <option value="pendingPhysiotherapist">{t('pending_pt_request')}</option>
            <option value="member">{t('members')}</option>
            <option value="admin">{t('admins')}</option>
          </select>

          {/* License Verification Filter */}
          <select
            className="select select-bordered select-xs"
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value)}
          >
            <option value="">{t('all_license_status')}</option>
            <option value="pending">{t('pending_verification')}</option>
            <option value="approved">{t('approved')}</option>
            <option value="rejected">{t('status_rejected')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl max-h-[500px] overflow-y-auto overflow-x-auto mt-4">
        <table className="w-full text-sm">
            <thead className="bg-gray-100 text-caribbean text-left">
            <tr>
              <th className="p-2">{t('name_label')}</th>
              <th className="p-2">{t('email_label')}</th>
              <th className="p-2">{t('role_label')}</th>
              <th className="p-2">{t('pt_status_label')}</th>
              <th className="p-2">{t('license_status_label')}</th>
              <th className="p-2"></th>
            </tr>
          </thead>

          <tbody className="text-tufts">
            {isLoading ? (
              <tr>
                <td className="p-0" colSpan="6">
                  <SectionSkeleton count={3} />
                </td>
              </tr>
            ) : displayUsers.length === 0 ? (
              <tr>
                <td className="p-4 text-center text-sm text-gray-500" colSpan="6">
                  {allUsers.length === 0 ? t('no_users_found') : t('no_users_match_filters')}
                </td>
              </tr>
            ) : (
              displayUsers.map((u) => {
                const license = u?.ptProfile?.licenses?.[0];
                return (
                  <tr key={u._id} className="border-t">
                    <td className="p-2">
                      <Link
                        to={`/admin/users/${u._id}`}
                        className="text-tufts underline hover:text-caribbean"
                      >
                        {u.fullName}
                      </Link>
                    </td>
                    <td className="p-2">
                      <Link
                        to={`/users/${u._id}/send-email`}
                        className="text-tufts underline hover:text-caribbean"

                      >
                        {u.email}
                      </Link>
                    </td>

                    <td className="p-2 capitalize">{u.role}</td>
                    <td className="p-2">
                      {u.role === "physiotherapist" ? "PT" : "-"}
                    </td>
                    <td className="p-2 capitalize">
                      {license?.verificationStatus || "N/A"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
