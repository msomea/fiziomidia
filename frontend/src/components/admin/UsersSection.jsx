import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import { useTranslation } from 'react-i18next'
import API from "../../api/axios";
import CollapsibleSection from "./CollapsibleSection";
import { API_URL } from "../../config/constants";
import { Link } from "react-router";
import { useDashboard } from "../../contexts/DashboardContext";

export default function AdminUsers() {
  const { t } = useTranslation()
  const { users, refreshUsers, loading: dashboardLoading } = useDashboard();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, licenseFilter]);

  useEffect(() => {
    // Initial load when component mounts
    if (users.length === 0) {
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      await refreshUsers({
        search,
        role: roleFilter,
        licenseStatus: licenseFilter,
      });
    } catch (error) {
      console.error(error);
      toast.error(t("failed_load_users"));
    } finally {
      setLoading(false);
    }
  };

  // Use dashboard loading state for initial load, local loading for refreshes
  const isLoading = dashboardLoading || loading;

  return (
    <CollapsibleSection title={t('users_management')}>
      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_placeholder_users')}
            className="w-full border rounded pl-8 p-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadUsers()}
          />
        </div>

        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {t('search_button')}
        </button>

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
            ) : users.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan="6">{t('no_users_found')}</td>
              </tr>
            ) : (
              users.map((u) => {
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
