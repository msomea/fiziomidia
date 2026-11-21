import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { fetchRequests } from "../../api/education";
import ResourceSkeleton from "../../components/education/ResourceSkeleton";
import { EDUCATION_CATEGORIES } from "../../constants/education";
import { BookOpen, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 12;

export default function ResourceNeeds() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const page = Math.max(parseInt(searchParams.get("page"), 10) || 1, 1);

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: "open", page, limit: PAGE_SIZE };
      if (category) params.category = category;
      const res = await fetchRequests(params);
      setRequests(res.data.requests || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_needs_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [category, page]);

  useEffect(() => { load(); }, [load]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-alice mt-20 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <BookOpen className="w-10 h-10 text-caribbean mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-caribbean">{t("edu_needs_title")}</h1>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{t("edu_needs_desc")}</p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setParam("category", "")}
            className={`badge badge-lg px-4 py-2 ${!category ? "bg-caribbean text-white border-none" : "bg-white text-tufts border border-gray-200"}`}
          >
            {t("edu_all_categories")}
          </button>
          {EDUCATION_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setParam("category", c.value === category ? "" : c.value)}
              className={`badge badge-lg px-4 py-2 ${category === c.value ? "bg-caribbean text-white border-none" : "bg-white text-tufts border border-gray-200"}`}
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>

        {loading ? (
          <ResourceSkeleton count={4} />
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-500">{t("edu_needs_empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((r) => (
              <div key={r._id} className="bg-white rounded-2xl shadow p-5">
                <h3 className="font-semibold text-gray-800">{r.title}</h3>
                {r.description && <p className="text-sm text-gray-500 mt-1 line-clamp-3">{r.description}</p>}
                <p className="text-xs text-gray-400 mt-3">
                  {t(`edu_cat_${r.category}`) || r.category?.replace(/_/g, " ")}
                  {r.preferredFormat && ` · ${r.preferredFormat.toUpperCase()}`}
                  {r.language && ` · ${r.language.toUpperCase()}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t("edu_requested_by")} {r.requestedBy?.fullName || "?"} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3">
            <button
              onClick={() => setParam("page", String(page - 1))}
              disabled={page <= 1}
              className="btn btn-sm btn-ghost"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">{t("edu_page_of", { page, total: totalPages })}</span>
            <button
              onClick={() => setParam("page", String(page + 1))}
              disabled={page >= totalPages}
              className="btn btn-sm btn-ghost"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#E0F7FA] to-[#D0F0F7] rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-caribbean">{t("edu_needs_cta_title")}</h2>
          <p className="text-gray-600 mt-2 mb-4">{t("edu_needs_cta_desc")}</p>
          <Link
            to="/education/requests"
            className="btn bg-caribbean text-white border-none hover:bg-tufts"
          >
            {t("edu_needs_cta_btn")} <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
