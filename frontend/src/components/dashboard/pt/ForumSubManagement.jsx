import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router";
import { API_URL } from "../../../config/constants";
import API from "../../../api/axios";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const ForumSubManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const fetchSubs = async () => {
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/forum/my-subs`);

        if (res.data.success) setSubs(res.data.subs);
      } catch (err) {
        console.error("Failed to fetch subs:", err);
        toast.error(t("failed_fetch_subs"));
      } finally {
        setLoading(false);
      }
    };

    fetchSubs();
  }, [user, t]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="animate-spin w-6 h-6 text-caribbean" />
        <span className="ml-2 text-gray-600">{t("loading")}</span>
      </div>
    );

  if (!subs.length)
    return (
      <p className="text-gray-500">
        {t("no_created_subs")}
      </p>
    );

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-2">
        {t("forum_sub_management")}
      </h2>

      {subs.map((sub) => (
        <Link
          key={sub._id}
          to={`/forum/sub/${sub._id}/manage`}
          className="block bg-white shadow rounded-lg p-3 hover:bg-alice transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-black">{sub.title}</span>

            <span className="text-gray-400 text-sm">
              {t("rules_count", { count: sub.rules?.length || 0 })}
            </span>
          </div>

          <p className="text-gray-500 text-sm line-clamp-2">
            {sub.description}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default ForumSubManagement;
