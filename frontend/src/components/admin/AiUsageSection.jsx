import { useEffect, useState, useCallback } from "react";
import { useDashboard } from "../../contexts/DashboardContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { RefreshCw, BarChart3 } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import { getAIUsageDashboard } from "../../api/ai";

const AGENT_LABELS = {
  physiotherapy: "Fizio AI",
  forumContent: "Forum Content",
  virtualAdmin: "Virtual Admin",
};

export default function AiUsageSection() {
  const { t } = useTranslation();
  const { aiUsage } = useDashboard();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Seed from dashboard context; refresh calls this section's own API
  useEffect(() => {
    if (aiUsage && !data) setData(aiUsage);
  }, [aiUsage, data]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAIUsageDashboard();
      setData(res);
    } catch (err) {
      console.error("AI usage load failed:", err);
      toast.error(err?.response?.data?.error || "Failed to load usage");
    } finally {
      setLoading(false);
    }
  }, []);

  // No mount fetch — data comes from the dashboard endpoint

  const agents = data?.agents || {};
  const daily = data?.daily || [];

  // Group daily rows by date for the 7-day table
  const byDate = {};
  daily.forEach((d) => {
    (byDate[d.date] = byDate[d.date] || []).push(d);
  });
  const dates = Object.keys(byDate).sort();

  return (
    <CollapsibleSection title={t("ai_usage_title")}>
      <div className="flex justify-end mb-3">
        <button onClick={load} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && !data ? (
        <SectionSkeleton count={1} />
      ) : !data ? (
        <SectionSkeleton count={1} />
      ) : (
        <>
          {/* Today's per-agent usage */}
          <h3 className="text-sm font-semibold text-caribbean mb-2 flex items-center gap-1">
            <BarChart3 size={16} /> {t("ai_usage_today")} — {data?.date}
          </h3>
          <div className="overflow-x-auto mb-5">
            <table className="table table-xs w-full text-tufts">
              <thead className="text-tufts">
                <tr>
                  <th>{t("ai_usage_agent")}</th>
                  <th>{t("ai_usage_quota")}</th>
                  <th>{t("ai_usage_requests")}</th>
                  <th>{t("ai_usage_tokens")}</th>
                  <th>{t("ai_usage_avg")}</th>
                </tr>
              </thead>
              <tbody className="text-tufts">
                {Object.entries(agents).map(([name, a]) => (
                  <tr key={name}>
                    <td className="font-medium">{AGENT_LABELS[name] || name}</td>
                    <td>
                      {a.quotaUsed}/{a.dailyCap}
                      <span className="text-gray-400 ml-1">
                        ({a.quotaRemaining} {t("ai_usage_left")})
                      </span>
                    </td>
                    <td>{a.loggedRequests}</td>
                    <td>{a.tokensToday.toLocaleString()}</td>
                    <td>{a.avgTokensPerRequest.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 7-day breakdown */}
          <h3 className="text-sm font-semibold text-caribbean mb-2">
            {t("ai_usage_week")}
          </h3>
          {dates.length === 0 ? (
            <p className="text-sm text-gray-500">{t("ai_usage_empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-xs w-full">
                <thead className="text-tufts">
                  <tr>
                    <th>{t("ai_usage_date")}</th>
                    {Object.keys(agents).map((name) => (
                      <th key={name} colSpan={2} className="text-center">
                        {AGENT_LABELS[name] || name}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th />
                    {Object.keys(agents).map((name) => (
                      <th key={`${name}-r`} className="text-center">
                        {t("ai_usage_requests")}
                      </th>
                    ))}
                    {Object.keys(agents).map((name) => (
                      <th key={`${name}-t`} className="text-center">
                        {t("ai_usage_tokens")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-tufts">
                  {dates.map((date) => (
                    <tr key={date}>
                      <td className="font-medium">{date}</td>
                      {Object.keys(agents).map((name) => {
                        const row = byDate[date].find((d) => d.agent === name);
                        return (
                          <td key={`${date}-${name}-r`} className="text-center">
                            {row?.requests ?? 0}
                          </td>
                        );
                      })}
                      {Object.keys(agents).map((name) => {
                        const row = byDate[date].find((d) => d.agent === name);
                        return (
                          <td key={`${date}-${name}-t`} className="text-center">
                            {(row?.tokens ?? 0).toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
