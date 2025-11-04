import React from "react";
import StatCard from "./StatCard";

const Statistics = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <StatCard title="Total Appointments" value={stats.totalAppointments} />
      <StatCard title="Pending Requests" value={stats.pendingRequests} />
      <StatCard title="Forum Posts" value={stats.totalForumPosts} />
      <StatCard title="Promo Days Left" value={stats.promotionDaysLeft} />
    </div>
  );
};

export default Statistics;
