import React from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const PromotionStatus = ({ promotion }) => {
  const { t } = useTranslation();


  if (!promotion || promotion?.status === "inactive") {
    return (
      <div className="bg-white p-4 rounded-xl shadow mt-3">
        <h2 className="text-lg font-semibold mb-3">
          {t("promotion_status")}
        </h2>

        <p className="text-gray-500 text-sm">
          {t("no_active_promotion")}
        </p>

        <a
          href="/services/promotions/create"
          className="text-blue-500 text-sm mt-3 block"
        >
          {t("add_new_promotion")} →
        </a>
      </div>
    );
  }

  // Calculate daysLeft if not provided (fallback)
  let daysLeft = promotion.daysLeft;
  if (daysLeft === undefined && promotion.endAt) {
    const endDate = dayjs(promotion.endAt);
    const today = dayjs();
    daysLeft = endDate.diff(today, 'day');
    daysLeft = Math.max(0, daysLeft);
  }

  const endsAt = promotion.endAt;
  const title = promotion.title;

  // Color scheme based on promotion title
  const getTitleColor = () => {
    switch (title) {
      case 'Platinum':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Gold':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Silver':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getProgressBarColor = () => {
    switch (title) {
      case 'Platinum':
        return 'bg-purple-500';
      case 'Gold':
        return 'bg-yellow-500';
      case 'Silver':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  let barColor = getProgressBarColor();
  if (daysLeft <= 7) barColor = "bg-red-500"; // Override to red for urgent

  const progressPercentage = Math.min(daysLeft, 30) * (100 / 30);

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-3">
      <h2 className="text-lg font-semibold mb-3">
        {t("promotion_status")}
      </h2>

      {daysLeft > 0 ? (
        <>
          {/* Promotion Title Badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full border ${getTitleColor()} mb-3`}>
            <span className="font-medium text-sm">{title}</span>
          </div>

          <p className="text-green-600 font-medium">
            {t("active_promotion")}
          </p>

          <p className="text-sm text-gray-600">
            {t("days_left")}: {daysLeft}
          </p>

          <p className="text-sm text-gray-600">
            {t("active_until")}:{" "}
            {dayjs(endsAt).format("ddd, DD/MM/YYYY")}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
            <div
              className={`${barColor} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <a
            href="/services/promotions/create"
            className="text-blue-500 text-sm mt-3 block"
          >
            {t("extend_promotion")} →
          </a>
        </>
      ) : (
        <>
          <p className="text-gray-500 text-sm">
            {t("no_active_promotion")}
          </p>

          <a
            href="/services/promotions/create"
            className="text-blue-500 text-sm mt-3 block"
          >
            {t("add_new_promotion")} →
          </a>
        </>
      )}
    </div>
  );
};

export default PromotionStatus;
