import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { fetchRequests, fetchMyRequests, closeRequest } from "../../api/education";
import ResourceRequestForm from "../../components/education/ResourceRequestForm";
import ResourceSkeleton from "../../components/education/ResourceSkeleton";
import { XCircle } from "lucide-react";

export default function ResourceRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [openRes, mineRes] = await Promise.all([
        fetchRequests({ status: "open", limit: 50 }),
        fetchMyRequests(),
      ]);
      setRequests(openRes.data.requests || []);
      setMyRequests(mineRes.data.requests || []);
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_requests_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleClose = async (id) => {
    setClosing(id);
    try {
      await closeRequest(id);
      toast.success(t("edu_request_closed"));
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_request_close_failed"));
    } finally {
      setClosing(null);
    }
  };

  return (
    <div className="min-h-screen bg-alice mt-20 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-caribbean">{t("edu_requests_title")}</h1>
          <p className="text-gray-600 mt-1">{t("edu_requests_desc")}</p>
        </div>

        <ResourceRequestForm onCreated={load} />

        {/* My requests */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-3">{t("edu_my_requests")}</h2>
          {loading ? (
            <ResourceSkeleton count={2} />
          ) : myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
              {t("edu_my_requests_empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((r) => (
                <div key={r._id} className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {r.category?.replace(/_/g, " ")} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-sm capitalize ${r.status === "open" ? "badge-warning" : r.status === "fulfilled" ? "badge-success" : "badge-ghost"}`}>
                      {r.status}
                    </span>
                    {r.status === "open" && (
                      <button
                        onClick={() => handleClose(r._id)}
                        disabled={closing === r._id}
                        className="btn btn-xs btn-ghost text-red-500"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Open requests */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-3">{t("edu_open_requests")}</h2>
          {loading ? (
            <ResourceSkeleton count={2} />
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
              {t("edu_open_requests_empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r._id} className="bg-white rounded-2xl shadow p-4">
                  <p className="font-medium text-gray-800">{r.title}</p>
                  {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {r.category?.replace(/_/g, " ")}
                    {r.preferredFormat && ` · ${r.preferredFormat.toUpperCase()}`}
                    {r.requestedBy?.fullName && ` · ${r.requestedBy.fullName}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
