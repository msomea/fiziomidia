import { useEffect, useState } from "react";
import { useParams } from "react-router";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/constants";

export default function AdminUserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await API.get(`/admin/users/${id}`);
    setUser(res.data.user);
    setNewRole(res.data.user.role);
  };

  const updateRole = async () => {
    await API.put(`/admin/users/${id}/role`, { role: newRole });
    toast.success("Role updated");
    load();
  };

  const verifyLicense = async (status) => {
    await API.put(`/admin/users/${id}/license`, {
      status,
      notes,
    });
    toast.success(`License ${status}`);
    load();
  };

  if (!user) return <p className="p-4 text-caribbean mt-20">Loading...</p>;

  const license = user?.ptProfile?.licenses?.[0];

  return (
    <div className="p-4 mt-20">
      <h2 className="text-xl font-bold text-caribbean">User Details</h2>

      <div className="mt-4 space-y-4">

        {/* Basic Info */}
        <div className="border p-4 rounded text-tufts">
          <h3 className="font-semibold text-lg text-caribbean">Basic Information</h3>
          <p>Name: {user.fullName}</p>
          <p>Email: {user.email}</p>
          <p>Phone: {user.phone}</p>

          {/* Role Change */}
          <div className="mt-3">
            <label className="block font-medium mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="member">Member</option>
              <option value="physiotherapist">Physiotherapist</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={updateRole}
              className="ml-3 bg-blue-600 text-white px-3 py-1 rounded"
            >
              Update
            </button>
          </div>
        </div>

        {/* PT License */}
        {license && (
          <div className="border p-4 rounded text-tufts">
            <h3 className="font-semibold text-lg text-caribbean">License Verification</h3>
            <p>License Number: {license.licenseNumber}</p>
            <p>Status: {license.verificationStatus}</p>
            <a
              href={`${API_URL}${license.licenseFileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View Uploaded License File
            </a>

            <textarea
              placeholder="Verification notes..."
              className="w-full border p-2 rounded mt-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex gap-3 mt-3">
              <button
                className="px-4 py-1 bg-green-600 text-white rounded"
                onClick={() => verifyLicense("approved")}
              >
                Approve
              </button>

              <button
                className="px-4 py-1 bg-red-600 text-white rounded"
                onClick={() => verifyLicense("rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
