import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";

export default function ForumModRequestsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequest();
  }, []);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/admin/forum/mod-requests/${id}`);
      setRequest(res.data.request);
      setNewRole(res.data.request.role); // current requested role
    } catch (err) {
      toast.error("Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async () => {
    try {
      await API.put(`/admin/forum/mod-requests/${id}/role`, { role: newRole });
      toast.success("Request role updated");
      loadRequest();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  if (loading || !request) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Request...</p>
      </div>
    );
  }

  return (
    <div className="p-4 mt-20 max-w-3xl mx-auto border rounded-lg shadow bg-gray-50">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold text-caribbean">Mod Request Details</h2>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-500 hover:text-red-800" />
        </button>
      </div>

      <div className="space-y-4 text-tufts">
        <p><b>User:</b> {request.user.fullName}</p>
        <p><b>Sub:</b> {request.sub.title}</p>
        <p><b>Current Status:</b> {request.status}</p>
        <p><b>Requested Role:</b> {request.role}</p>
        <p><b>Reason:</b> {request.reason || "-"}</p>

        <div className="mt-3">
          <label className="block font-medium mb-1">Assign Role</label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="member">Member</option>
            <option value="sub-mod">Sub-Moderator</option>
            <option value="mod">Moderator</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={updateRole}
            className="ml-3 bg-blue-600 text-white px-3 py-1 rounded"
          >
            Update Role
          </button>
        </div>
      </div>
    </div>
  );
}
