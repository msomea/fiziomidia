import React from "react";
import { useTranslation } from "react-i18next";
import StatCard from "./StatCard";

const Statistics = ({ stats }) => {
  const { t } = useTranslation();

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <StatCard 
        title={t("total_appointments")} 
        value={stats.totalAppointments} 
      />
      <StatCard 
        title={t("pending_requests")} 
        value={stats.pendingRequests} 
      />
      <StatCard 
        title={t("forum_posts")} 
        value={stats.totalForumPosts} 
      />
      <StatCard 
        title={t("promo_days_left")} 
        value={stats.promotionDaysLeft} 
      />
    </div>
  );
};

export default Statistics;
