import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";

export default function ForumModRequestsSection() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [status]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_URL}/admin/forum/mod-requests`, {
        params: { status },
      });
      setRequests(res.data.requests || []);
    } catch (err) {
      toast.error("Failed to fetch moderator requests");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s) => {
    const base = "px-2 py-0.5 rounded text-xs font-medium";
    if (s === "approved") return `${base} bg-green-100 text-green-700`;
    if (s === "rejected") return `${base} bg-red-100 text-red-700`;
    return `${base} bg-yellow-100 text-yellow-700`;
  };

  return (
    <CollapsibleSection title="Forum Moderator Requests">
      <div className="space-y-4">
        {/* FILTER */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded w-full md:w-64"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* RESULTS */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-caribbean animate-spin" />
            <p className="mt-3 text-caribbean font-medium animate-pulse">
              Loading moderator requests...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-gray-500 text-sm mt-10">
            No moderator requests found
          </p>
        ) : (
          requests.map((req) => (
            <div
              key={req._id}
              className="border rounded p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() =>
                navigate(`/admin/forum/mod-requests/${req._id}`)
              }
            >
              <div className="flex justify-between items-start">
                <div className="text-sm text-tufts space-y-1">
                  <p className="font-semibold text-caribbean">
                    {req.user?.fullName}
                  </p>
                  <p className="text-xs text-gray-600">{req.user?.email}</p>

                  <p>
                    <span className="font-semibold">Sub:</span> {req.sub?.title}{" "}
                    <span className="text-gray-400">(/ {req.sub?.slug})</span>
                  </p>

                  <span className={statusBadge(req.status)}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}
