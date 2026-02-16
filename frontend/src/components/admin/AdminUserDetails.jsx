import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { X, Loader2 } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/constants";

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [notes, setNotes] = useState([]); // ✅ FIXED (array)
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingLicense, setUpdatingLicense] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_URL}/admin/users/${id}`);
      setUser(res.data.user);
      setNewRole(res.data.user.role);
    } catch (err) {
      toast.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED updateRole (closed function properly)
  const updateRole = async () => {
    try {
      setUpdatingRole(true);
      await API.put(`${API_URL}/admin/users/${id}/role`, { role: newRole });
      toast.success("Role updated");
      load();
    } catch (err) {
      console.error("Role update failed:", err);
      toast.error("Failed to update role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const verifyLicense = async (status, idx) => {
    try {
      setUpdatingLicense(true);

      const response = await API.put(
        `${API_URL}/admin/users/${id}/license`,
        {
          status,
          notes: notes[idx] || "",
          index: idx,
        }
      );

      setUser(response.data.user);

      toast.success(
        status === "approved"
          ? "License approved and user granted physiotherapist access"
          : "License rejected"
      );
    } catch (err) {
      console.error("License verification failed:", err);
      toast.error("Failed to update license status");
    } finally {
      setUpdatingLicense(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          Loading User...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 mt-20 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-caribbean">User Details</h2>

      <div className="mt-4 space-y-6">

        {/* Basic Info */}
        <div className="border p-4 rounded text-tufts">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold text-caribbean">
              Basic Information
            </h3>
            <button onClick={() => navigate(-1)}>
              <X className="text-red-400 hover:text-red-800" />
            </button>
          </div>

          <p>ID: {user._id}</p>
          <p>Name: {user.fullName}</p>
          <p>Email: {user.email}</p>
          <p>Phone: {user.phone}</p>

          {/* Role Change */}
          <div className="mt-4">
            <label className="block font-medium mb-1">Role</label>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="member">Member</option>
                <option value="pendingPhysiotherapist">
                  Pending PT verification
                </option>
                <option value="physiotherapist">
                  Physiotherapist
                </option>
                <option value="admin">Admin</option>
              </select>

              <button
                onClick={updateRole}
                disabled={updatingRole}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {updatingRole ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update Role"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* PT Licenses */}
        {user.ptProfile?.licenses?.map((license, idx) => (
          <div key={license._id} className="border p-4 rounded text-tufts">
            <h3 className="font-semibold text-lg text-caribbean">
              License Verification
            </h3>

            <p>License Number: {license.licenseNumber}</p>
            <p>Status: {license.verificationStatus}</p>

            <a
              href={license.licenseFileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View Uploaded License File
            </a>

            <textarea
              placeholder="Verification notes..."
              className="w-full border p-2 rounded mt-3"
              value={notes[idx] || ""}
              onChange={(e) => {
                const newNotes = [...notes];
                newNotes[idx] = e.target.value;
                setNotes(newNotes);
              }}
            />

            <div className="flex flex-wrap gap-3 mt-3">
              <button
                disabled={updatingLicense}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                onClick={() => verifyLicense("approved", idx)}
              >
                {updatingLicense ? "Updating..." : "Approve"}
              </button>

              <button
                disabled={updatingLicense}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                onClick={() => verifyLicense("rejected", idx)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
