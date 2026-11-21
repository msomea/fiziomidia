import { Link } from "react-router";
import { FileText, Download, User } from "lucide-react";
import { useTranslation } from "react-i18next";

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ResourceCard({ resource, showStatus = false }) {
  const { t } = useTranslation();
  const r = resource;

  return (
    <Link
      to={`/education/resources/${r._id}`}
      className="block bg-white rounded-2xl shadow hover:shadow-lg transition-shadow p-5"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-alice rounded-lg shrink-0">
          <FileText className="w-6 h-6 text-caribbean" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-800 truncate">{r.title}</h3>
          {r.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {r.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="badge badge-sm bg-alice text-tufts border-none">
          {r.category?.replace(/_/g, " ")}
        </span>
        <span className="badge badge-sm badge-ghost uppercase">
          {r.fileType}
        </span>
        <span className="text-xs text-gray-400">{formatSize(r.fileSize)}</span>
        {showStatus && r.status && (
          <span className="badge badge-sm badge-warning capitalize">
            {r.status}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {r.uploadedBy?.fullName || t("edu_unknown_contributor")}
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          {r.downloadCount || 0}
        </span>
      </div>
    </Link>
  );
}
