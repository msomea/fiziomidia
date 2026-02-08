import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { X } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/constants";
import { Loader2 } from "lucide-react";

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await API.get(`${API_URL}/admin/users/${id}`);
    setUser(res.data.user);
    setNewRole(res.data.user.role);
  };

  const updateRole = async () => {
    await API.put(`${API_URL}/admin/users/${id}/role`, { role: newRole });
    toast.success("Role updated");
    load();
  };

  const verifyLicense = async (status, idx) => {
  try {
    const response = await API.put(`${API_URL}/admin/users/${id}/license`, {
      status,
      notes: notes[idx] || "",
      index: idx,
    });

    setUser(response.data.user);
    toast.success(
      status === "approved"
        ? "License approved and user granted physiotherapist access"
        : "License rejected"
    );
  } catch (err) {
    console.error("License verification failed:", err);
    toast.error("Failed to update license status");
  }
};


  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="p-4 mt-20">
      <h2 className="text-xl font-bold text-caribbean">User Details</h2>

      <div className="mt-4 space-y-4">

        {/* Basic Info */}
        <div className="border p-4 rounded text-tufts">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold text-caribbean">Basic Information</h3>
            <button onClick={() => navigate(-1)}><X className="text-red-400 hover:text-red-800"/></button>
          </div>
          <p>ID: {user._id}</p>
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
              <option value="pendingPhysiotherapist">Pending PT verification</option>
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

        {/* PT Licenses Management */}
        {user.ptProfile && user.ptProfile.licenses.map((license, idx) => (
        <div key={license._id} className="border p-4 rounded text-tufts">
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
            value={notes[idx] || ""}
            onChange={(e) => {
              const newNotes = [...notes];
              newNotes[idx] = e.target.value;
              setNotes(newNotes);
            }}
          />

          <div className="flex gap-3 mt-3">
            <button
              className="px-4 py-1 bg-green-600 text-white rounded"
              onClick={() => verifyLicense("approved", idx)}
            >
              Approve
            </button>

            <button
              className="px-4 py-1 bg-red-600 text-white rounded"
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
