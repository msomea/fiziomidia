import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ArrowLeft, Download, Flag, FileText, User, Calendar, Globe } from "lucide-react";
import { fetchResource, fetchDownloadUrl } from "../../api/education";
import { useAuth } from "../../contexts/AuthContext";
import CopyrightReportModal from "../../components/education/CopyrightReportModal";
import ResourceSkeleton from "../../components/education/ResourceSkeleton";

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ResourceDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resource, setResource] = useState(null);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchResource(id);
        setResource(res.data.resource);
        setQuota(res.data.downloadQuota || null);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error(t("edu_details_load_failed"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownload = async () => {
    if (!user || user.role === "guest") {
      toast.error(t("edu_login_to_download"));
      navigate("/login");
      return;
    }
    setDownloading(true);
    try {
      const res = await fetchDownloadUrl(id);
      const { downloadUrl } = res.data;
      // Open signed URL in new tab
      window.open(downloadUrl, "_blank");
      toast.success(t("edu_download_started"));
      // Consume one unit of the daily quota locally
      setQuota((q) =>
        q ? { ...q, used: q.used + 1, remaining: Math.max(0, q.remaining - 1) } : q
      );
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error(t("edu_daily_limit_reached"));
        setQuota((q) => (q ? { ...q, remaining: 0 } : q));
      } else {
        toast.error(err.response?.data?.error || t("edu_download_failed"));
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-alice mt-20 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <ResourceSkeleton count={1} />
        </div>
      </div>
    );
  }

  if (notFound || !resource) {
    return (
      <div className="min-h-screen bg-alice mt-20 py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-gray-500">{t("edu_details_not_found")}</p>
          <Link to="/education/library" className="btn btn-sm bg-caribbean text-white border-none mt-4">
            {t("edu_back_to_library")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alice mt-20 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/education/library" className="inline-flex items-center gap-2 text-caribbean hover:text-tufts mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> {t("edu_back_to_library")}
        </Link>

        <div className="bg-white rounded-2xl shadow p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-alice rounded-xl shrink-0">
              <FileText className="w-8 h-8 text-caribbean" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-800">{resource.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="badge badge-sm bg-alice text-tufts border-none capitalize">
                  {resource.category?.replace(/_/g, " ")}
                </span>
                <span className="badge badge-sm badge-ghost uppercase">{resource.fileType}</span>
                <span className="badge badge-sm badge-ghost">{formatSize(resource.fileSize)}</span>
              </div>
            </div>
          </div>

          {resource.description && (
            <p className="text-gray-700 mt-6 whitespace-pre-wrap">{resource.description}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              {resource.uploadedBy?.fullName || t("edu_unknown_contributor")}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {new Date(resource.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              {resource.language?.toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-400" />
              {resource.downloadCount || 0} {t("edu_downloads")}
            </div>
          </div>

          {quota && user?.role !== "admin" && (
            <p className="text-xs text-gray-500 mt-2">
              {t("edu_downloads_remaining", {
                remaining: quota.remaining,
                limit: quota.limit,
              })}
            </p>
          )}

          {resource.downloadHold && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              {t("edu_under_review_notice")}
            </div>
          )}

          <div className="mt-6 p-4 bg-alice rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-1">{t("edu_license_info")}</h3>
            <p className="text-sm text-gray-600">
              {t(`edu_license_${resource.licenseType}`)}
            </p>
            {resource.licenseUrl && (
              <a href={resource.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-tufts hover:underline break-all">
                {resource.licenseUrl}
              </a>
            )}
            {resource.licenseNotes && (
              <p className="text-sm text-gray-500 mt-1">{resource.licenseNotes}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            {resource.downloadHold ? (
              <button
                disabled
                className="btn bg-gray-300 text-gray-500 border-none cursor-not-allowed"
                title={t("edu_download_unavailable")}
              >
                <Download className="w-4 h-4" />
                {t("edu_download_unavailable")}
              </button>
            ) : quota && quota.remaining === 0 ? (
              <button
                disabled
                className="btn bg-gray-300 text-gray-500 border-none cursor-not-allowed"
                title={t("edu_daily_limit_reached")}
              >
                <Download className="w-4 h-4" />
                {t("edu_download_unavailable")}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn bg-caribbean text-white border-none hover:bg-tufts"
              >
                <Download className="w-4 h-4" />
                {downloading ? t("edu_preparing_download") : t("edu_download")}
              </button>
            )}
            <button
              onClick={() => setShowReport(true)}
              className="btn btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
            >
              <Flag className="w-4 h-4" />
              {t("edu_report_concern")}
            </button>
          </div>
        </div>
      </div>

      {showReport && (
        <CopyrightReportModal resourceId={id} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
