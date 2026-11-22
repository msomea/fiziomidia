import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import ResourceFilters from "../../components/education/ResourceFilters";
import ResourceCard from "../../components/education/ResourceCard";
import ResourceSkeleton from "../../components/education/ResourceSkeleton";
import { useEducationResources } from "../../hooks/useEducationResources";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const URL_FILTER_KEYS = ["search", "category", "subCategory", "language", "fileType", "sort"];

export default function ResourceLibrary() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // Initial params from URL (e.g. /education/library?category=anatomy)
  const initialParams = { page: 1, limit: 12 };
  URL_FILTER_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) initialParams[key] = value;
  });

  const { resources, pagination, loading, error, params, updateParams, goToPage } =
    useEducationResources(initialParams);

  // Keep filters in sync when URL changes (e.g. category chip clicked while on library)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const next = { page: 1 };
    URL_FILTER_KEYS.forEach((key) => {
      next[key] = searchParams.get(key) || undefined;
    });
    updateParams(next);
  }, [searchParams, updateParams]);

  return (
    <div className="min-h-screen bg-alice mt-20 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-caribbean">{t("edu_library_title")}</h1>
          <p className="text-gray-600 mt-1">{t("edu_library_desc")}</p>
        </div>

        <ResourceFilters params={params} onChange={updateParams} />

        {loading ? (
          <ResourceSkeleton count={8} />
        ) : error ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600">{error}</p>
            <button className="btn btn-sm bg-caribbean text-white border-none mt-4" onClick={() => window.location.reload()}>
              {t("retry")}
            </button>
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-500">{t("edu_library_empty")}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((r) => (
                <ResourceCard key={r._id} resource={r} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  {t("edu_page_of", { page: pagination.page, total: pagination.totalPages })}
                </span>
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
