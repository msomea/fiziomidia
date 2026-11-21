import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyResources, deleteResource } from "../../api/education";
import ResourceCard from "../../components/education/ResourceCard";
import ResourceSkeleton from "../../components/education/ResourceSkeleton";
import ResourceStatusBadge from "../../components/education/ResourceStatusBadge";
import { Trash2 } from "lucide-react";

export default function MyResources() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user || user.role === "guest";
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchMyResources({ limit: 50 });
      setResources(res.data.resources || []);
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_my_load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isGuest) {
      navigate("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  const handleWithdraw = async (id) => {
    if (!window.confirm(t("edu_withdraw_confirm"))) return;
    setWithdrawing(id);
    try {
      await deleteResource(id);
      toast.success(t("edu_withdraw_success"));
      setResources((rs) => rs.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_withdraw_failed"));
    } finally {
      setWithdrawing(null);
    }
  };

  return (
    <div className="min-h-screen bg-alice mt-20 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-caribbean mb-2">{t("edu_my_title")}</h1>
        <p className="text-gray-600 mb-6">{t("edu_my_desc")}</p>

        {loading ? (
          <ResourceSkeleton count={4} />
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-500">{t("edu_my_empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((r) => (
              <div key={r._id} className="relative">
                <ResourceCard resource={r} showStatus />
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <ResourceStatusBadge status={r.status} />
                  {r.status === "pending" && (
                    <button
                      onClick={() => handleWithdraw(r._id)}
                      disabled={withdrawing === r._id}
                      className="btn btn-xs btn-error btn-outline"
                      title={t("edu_withdraw")}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {r.rejectionReason && (
                  <p className="text-xs text-red-500 mt-2 px-1">{t("edu_rejection_reason")}: {r.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
