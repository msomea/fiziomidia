import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PTSubManagementPage() {
  const { t } = useTranslation();
  const { subId } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const subRes = await API.get(`${API_URL}/forum/subs/${subId}`);
      const subData = subRes.data.sub;

      setSub(subData);
      setTitle(subData.title || "");
      setDescription(subData.description || "");
      setRules((subData.rules || []).join("\n"));
    } catch (err) {
      console.error(err);
      toast.error(t("failed_fetch_sub"));
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
        `${API_URL}/forum/subs/${subId}/mod-requests?status=${activeTab}`
      );
      setRequests(res.data.requests || []);
    } catch (err) {
      toast.error(t("failed_load_requests"));
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

      const res = await API.put(`${API_URL}/forum/subs/${subId}`, payload);

      if (!res.data.success) throw new Error();

      setSub(res.data.sub);
      toast.success(t("sub_updated_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("failed_update_sub"));
    }
  };

  /* ---------------- MOD REQUEST UPDATE ---------------- */
  const handleUpdateRequest = async (requestId, role) => {
    try {
      await API.patch(
        `${API_URL}/forum/subs/${subId}/mod-requests/${requestId}`,
        { role }
      );

      toast.success(t("role_updated"));
      await Promise.all([fetchRequests(), fetchSubData()]);
    } catch (err) {
      toast.error(t("failed_update_role"));
    }
  };

  if (loading) return <p>{t("loading")}...</p>;
  if (!sub) return <p>{t("sub_not_found")}</p>;

  return (
    <div className="p-4 space-y-8 mt-20">
      <div className="flex justify-between mb-3">
        <h1 className="text-2xl text-caribbean font-bold">
          {t("manage_sub")}: {sub.title}
        </h1>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-400 hover:text-red-800" />
        </button>
      </div>

      {/* ---------- SUB INFO FORM ---------- */}
      <form
        onSubmit={handleUpdateSub}
        className="bg-white p-4 rounded shadow space-y-4"
      >
        <h2 className="font-semibold text-caribbean text-lg">
          {t("edit_sub_info")}
        </h2>

        <input
          className="w-full border p-2 rounded"
          placeholder={t("title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder={t("description")}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder={t("rules_one_per_line")}
          rows={4}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
        />

        <button className="bg-tufts text-white px-4 py-2 rounded">
          {t("save_changes")}
        </button>
      </form>

      {/* ---------- MODERATOR REQUESTS ---------- */}
      <div className="bg-white p-4 text-caribbean rounded shadow">
        <h2 className="font-semibold text-lg mb-3">
          {t("moderator_requests")}
        </h2>

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
              {t(`status_${s}`)}
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
                    {t("current_role")}: {t(`role_${r.role}`)}
                  </p>
                </div>

                <select
                  key={`${r._id}-${r.role}-${r.status}`}
                  className="border p-2 rounded"
                  defaultValue=""
                  onChange={(e) => handleUpdateRequest(r._id, e.target.value)}
                >
                  <option value="" disabled>
                    {t("change_role")}
                  </option>

                  {r.status !== "approved" && (
                    <>
                      <option value="sub_mod">{t("approve_as_sub_mod")}</option>
                      <option value="mod">{t("approve_as_mod")}</option>
                    </>
                  )}

                  {r.status === "approved" && r.role === "sub_mod" && (
                    <>
                      <option value="mod">{t("upgrade_to_mod")}</option>
                      <option value="member">{t("remove_mod")}</option>
                    </>
                  )}

                  {r.status === "approved" && r.role === "mod" && (
                    <>
                      <option value="sub_mod">{t("downgrade_to_sub_mod")}</option>
                      <option value="member">{t("remove_mod")}</option>
                    </>
                  )}
                </select>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("no_requests", { status: t(`status_${activeTab}`) })}</p>
        )}
      </div>
    </div>
  );
}
