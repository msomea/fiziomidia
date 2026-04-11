import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Filter, RotateCcw } from "lucide-react";
import { useTranslation } from 'react-i18next'
import CollapsibleSection from "./CollapsibleSection";
import { Link } from "react-router";
import { useDashboard } from "../../contexts/DashboardContext";
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

  // Debounced search function
  const debouncedLoadUsers = useCallback((filters) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        console.log('Loading users with filters:', filters);
        const result = await refreshUsers(filters);
        console.log('Users loaded successfully:', result);
      } catch (error) {
        console.error('Failed to load users:', error);
        toast.error(t("failed_load_users"));
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce delay
  }, [refreshUsers, t]);

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
      console.log('Manual refresh users with filters:', filters);
      const result = await refreshUsers(filters);
      console.log('Users refreshed successfully:', result);
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

  // Use dashboard loading state for initial load, local loading for refreshes
  const isLoading = dashboardLoading || loading;
  const displayUsers = filteredUsers;

  return (
    <CollapsibleSection title={t('users_management')}>
      {/* Search + Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder_users')}
              className="w-full border rounded pl-8 p-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2 bg-caribbean text-white rounded hover:bg-caribbean/80 disabled:opacity-50 flex items-center gap-2"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setLicenseFilter("");
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />

          {/* Role Filter */}
          <select
            className="border p-2 rounded"
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
            className="border p-2 rounded"
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value)}
          >
            <option value="">{t('all_license_status')}</option>
            <option value="pending">{t('pending_verification')}</option>
            <option value="approved">{t('approved')}</option>
            <option value="rejected">{t('rejected')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded">
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
                <td className="p-4 text-center" colSpan="6">Loading...</td>
              </tr>
            ) : displayUsers.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan="6">
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
