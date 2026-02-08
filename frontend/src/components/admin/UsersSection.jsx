import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import API from "../../api/axios";
import CollapsibleSection from "./CollapsibleSection";
import { API_URL } from "../../config/constants";
import { Link } from "react-router";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, licenseFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_URL}/admin/users`, {
        params: {
          search,
          role: roleFilter,
          licenseStatus: licenseFilter,
        },
      });
      setUsers(res.data.users);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CollapsibleSection title="Users Managements">
      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
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
          Search
        </button>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />

          {/* Role Filter */}
          <select
            className="border p-2 rounded"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="physiotherapist">Physiotherapists</option>
            <option value="pendingPhysiotherapist">Pending PT Request</option>
            <option value="member">Members</option>
            <option value="admin">Admins</option>
          </select>

          {/* License Verification Filter */}
          <select
            className="border p-2 rounded"
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value)}
          >
            <option value="">All License Status</option>
            <option value="pending">Pending Verification</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-caribbean text-left">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">PT Status</th>
              <th className="p-2">License Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>

          <tbody className="text-tufts">
            {loading ? (
              <tr>
                <td className="p-4 text-center" colSpan="6">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan="6">No users found</td>
              </tr>
            ) : (
              users.map((u) => {
                const license = u?.ptProfile?.licenses?.[0];
                return (
                  <tr key={u._id} className="border-t">
                    <td className="p-2">{u.fullName}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2 capitalize">{u.role}</td>
                    <td className="p-2">
                      {u.role === "physiotherapist" ? "PT" : "-"}
                    </td>
                    <td className="p-2 capitalize">
                      {license?.verificationStatus || "N/A"}
                    </td>
                    <td className="p-2">
                      <Link
                        to={`/admin/users/${u._id}`}
                        className="text-blue-600 underline"
                      >
                        View
                      </Link>
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
