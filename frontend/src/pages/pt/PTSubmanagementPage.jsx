import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { X } from "lucide-react";

export default function PTSubManagementPage() {
  const { subId } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // sub edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchSubData();
  }, [subId]);

  const fetchSubData = async () => {
    try {
      setLoading(true);

      const subRes = await API.get(`/forum/subs/${subId}`);
      const subData = subRes.data.sub;

      setSub(subData);
      setTitle(subData.title || "");
      setDescription(subData.description || "");
      setRules((subData.rules || []).join("\n"));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch Sub");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [subId, activeTab]);

  const fetchRequests = async () => {
    try {
      const res = await API.get(
        `/forum/subs/${subId}/mod-requests?status=${activeTab}`
      );
      setRequests(res.data.requests || []);
    } catch (err) {
      toast.error("Failed to load requests");
    }
  };


  /* ---------------- SUB UPDATE ---------------- */

  const handleUpdateSub = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title,
        description,
        rules: rules
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean),
      };

      const res = await API.put(`/forum/subs/${subId}`, payload);

      if (!res.data.success) throw new Error();

      setSub(res.data.sub);
      toast.success("Sub updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update sub");
    }
  };

  /* ---------------- MOD REQUEST UPDATE ---------------- */

  const handleUpdateRequest = async (requestId, role) => {
    try {
      await API.patch(
        `/forum/subs/${subId}/mod-requests/${requestId}`,
        { role }
      );

      toast.success("Role updated");
      await Promise.all([fetchRequests(), fetchSubData()]);
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!sub) return <p>Sub not found.</p>;
console.log(requests)
  return (
    <div className="p-4 space-y-8 mt-20">
      <div className="flex justify-between mb-3">
        <h1 className="text-2xl text-caribbean font-bold">Manage Sub: {sub.title}</h1>
        <button onClick={() => navigate(-1)}><X className="text-red-400 hover:text-red-800"/></button>
      </div>

      {/* ---------- SUB INFO FORM ---------- */}
      <form
        onSubmit={handleUpdateSub}
        className="bg-white p-4 rounded shadow space-y-4"
      >
        <h2 className="font-semibold text-caribbean text-lg">Edit Sub Info</h2>

        <input
          className="w-full border p-2 rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder="Rules (one per line)"
          rows={4}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
        />

        <button className="bg-tufts text-white px-4 py-2 rounded">
          Save Changes
        </button>
      </form>

      {/* ---------- MODERATOR REQUESTS ---------- */}
      <div className="bg-white p-4 text-caribbean rounded shadow">
        <h2 className="font-semibold text-lg mb-3">Moderator Requests</h2>

        {/* STATUS TABS*/}
        <div className="flex gap-2 mb-4">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-3 py-1 rounded ${
                activeTab === s ? "bg-tufts text-white" : "bg-gray-200"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* REQUEST LIST */}
        {requests.length ? (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li
                key={r._id}
                className="flex justify-between items-center border p-3 rounded"
              >
                <div>
                  <p className="font-medium">{r.user.fullName}</p>
                  <p className="text-sm text-gray-500">
                    Current role: {r.role}
                  </p>
                </div>

                <select
                  key={`${r._id}-${r.role}-${r.status}`}
                  className="border p-2 rounded"
                  defaultValue=""
                  onChange={(e) => handleUpdateRequest(r._id, e.target.value)}
                >
                  <option value="" disabled>Change role</option>

                  {r.status !== "approved" && (
                    <>
                      <option value="sub_mod">Approve as Sub Mod</option>
                      <option value="mod">Approve as Mod</option>
                    </>
                  )}

                  {r.status === "approved" && r.role === "sub_mod" && (
                    <>
                      <option value="mod">Upgrade to Mod</option>
                      <option value="member">Remove Mod</option>
                    </>
                  )}

                  {r.status === "approved" && r.role === "mod" && (
                    <>
                      <option value="sub_mod">Downgrade to Sub Mod</option>
                      <option value="member">Remove Mod</option>
                    </>
                  )}
                </select>

              </li>
            ))}
          </ul>
        ) : (
          <p>No {activeTab} requests</p>
        )}
      </div>
    </div>
  );
}
