import React from "react";
import dayjs from "dayjs";

const PromotionStatus = ({ promotion }) => {
  if (!promotion?.active) {
    return (
      <div className="bg-white p-4 rounded-xl shadow mt-6">
        <h2 className="text-lg font-semibold mb-3">Promotion Status</h2>
        <p className="text-gray-500 text-sm">No active promotion</p>
        <a href="/promotion/new" className="text-blue-500 text-sm mt-3 block">
          Add new promotion →
        </a>
      </div>
    );
  }

  // Determine progress bar color
  console.log("Promotion at component", promotion)
  const { daysLeft } = promotion;
  const endsAt = promotion.promotion.endAt
  console.log(`Days left: ${daysLeft} Ends at: ${endsAt}`)
  let barColor = "bg-red-500";
  if (daysLeft > 15) barColor = "bg-caribbean"; // green
  else if (daysLeft > 7) barColor = "bg-yellow-400"; // yellow

  // Optional: cap progress to 100% for visual width calculation
  const progressPercentage = Math.min(daysLeft, 30) * (100 / 30); // assuming 30 days max

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-6">
      <h2 className="text-lg font-semibold mb-3">Promotion Status</h2>
      <p className="text-green-600 font-medium">Active promotion</p>
      <p className="text-sm text-gray-600">Days left: {daysLeft}</p>
      <p className="text-sm text-gray-600">
        Active until: {dayjs(endsAt).format("ddd, DD/MM/YYYY")}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
        <div
          className={`${barColor} h-3 rounded-full`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <a href="/promotion/extend" className="text-blue-500 text-sm mt-3 block">
        Extend promotion →
      </a>
    </div>
  );
};

export default PromotionStatus;
