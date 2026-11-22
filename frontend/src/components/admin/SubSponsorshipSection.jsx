import { useState, useMemo } from "react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router";
import { RefreshCw } from "lucide-react";
import { useDashboard } from "../../contexts/DashboardContext";

export default function SponsorshipSection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const fallbackLang = "en";
  const { forumSubs, fetchDashboardData, loading: dashboardLoading } = useDashboard();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Stats derived from forum subs in context
  const stats = useMemo(() => {
    const source = Array.isArray(forumSubs) ? forumSubs : [];
    return {
      total: source.length,
      sponsored: source.filter((s) => s.isSponsored === true).length,
      notSponsored: source.filter((s) => s.isSponsored !== true).length,
    };
  }, [forumSubs]);

  // 🔎 Filter logic (applied instantly in UI)
  const filteredSubs = forumSubs.filter((sub) => {
    const titleText = sub.title?.[currentLang] || sub.title?.[fallbackLang] || "";
    const matchesSearch =
      titleText.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "sponsored"
        ? sub.isSponsored === true
        : sub.isSponsored === false;

    return matchesSearch && matchesStatus;
  });

  const isLoading = dashboardLoading;

  return (
    <CollapsibleSection title={t('forum_sponsorships')}>
      <div className="flex justify-end mb-3">
        <button onClick={() => fetchDashboardData()} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ["stat_total", stats.total],
            ["sponsored", stats.sponsored],
            ["not_sponsored", stats.notSponsored],
          ].map(([key, val]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{val}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {/* 🔍 Search + Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          placeholder={t('search_by_sub_name')}
          className="input input-bordered input-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="select select-bordered select-xs"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">{t('filter_all')}</option>
          <option value="sponsored">{t('filter_sponsored')}</option>
          <option value="not_sponsored">{t('filter_not_sponsored')}</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : filteredSubs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{t('no_subs_found')}</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredSubs.map((sub) => {
            const titleText = sub.title?.[currentLang] || sub.title?.[fallbackLang] || "";

            return (
              <div
                key={sub._id}
                className="border border-gray-200 rounded-xl p-3 text-sm text-tufts"
              >
                <Link to={`/admin/sponsorship/${sub._id}`}>
                  <h2 className="text-caribbean">
                    <b>{t('sub_label_short')}</b> #{sub._id}
                  </h2>
                </Link>

                <p>
                  <b>{t('name_label')}</b> {titleText}
                </p>

                <p>
                  <b>{t('status_label')}</b>{" "}
                  {sub.isSponsored ? (
                    <span className="text-green-600">{t('sponsored')}</span>
                  ) : (
                    <span className="text-red-600">{t('not_sponsored')}</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
}
