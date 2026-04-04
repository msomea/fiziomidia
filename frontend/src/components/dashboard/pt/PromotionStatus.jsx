import React from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const PromotionStatus = ({ promotion }) => {
  const { t } = useTranslation();

  if (!promotion?.active) {
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

  const { daysLeft } = promotion;
  const endsAt = promotion.promotion.endAt;

  let barColor = "bg-red-500";
  if (daysLeft > 15) barColor = "bg-caribbean";
  else if (daysLeft > 7) barColor = "bg-yellow-400";

  const progressPercentage = Math.min(daysLeft, 30) * (100 / 30);

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-3">
      <h2 className="text-lg font-semibold mb-3">
        {t("promotion_status")}
      </h2>

      {daysLeft > 0 ? (
        <>
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
              className={`${barColor} h-3 rounded-full`}
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
