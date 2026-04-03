import { useEffect, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";
import { Link } from "react-router";
import { useDashboard } from "../../contexts/DashboardContext";

export default function SponsorshipSection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const fallbackLang = "en";
  const { forumSubs, loading: dashboardLoading } = useDashboard();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial load when component mounts
    if (forumSubs.length === 0) {
      setLoading(true);
      // Data will be loaded by DashboardContext initial fetch
      setTimeout(() => setLoading(false), 1000);
    }
  }, []);

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

  // Use dashboard loading state for initial load
  const isLoading = dashboardLoading || loading;

  return (
    <CollapsibleSection title={t('forum_sponsorships')}>
      {/* 🔍 Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder={t('search_by_sub_name')}
          className="border p-2 rounded w-full md:w-1/2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Filter Dropdown */}
        <select
          className="border p-2 rounded w-full md:w-1/3"
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
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean"></div>
          <span className="ml-2 text-gray-500">Loading forum subs...</span>
        </div>
      ) : filteredSubs.length === 0 ? (
        <p className="text-gray-500 text-sm mt-4">{t('no_subs_found')}</p>
      ) : (
        <>
          {/* Listing */}
          {filteredSubs.map((sub) => {
            const titleText = sub.title?.[currentLang] || sub.title?.[fallbackLang] || "";

            return (
              <div
                key={sub._id}
                className="mt-2 border p-2 rounded text-sm text-tufts"
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
        </>
      )}
    </CollapsibleSection>
  );
}