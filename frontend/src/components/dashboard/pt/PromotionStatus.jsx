import React from "react";
import dayjs from "dayjs";

const PromotionStatus = ({ promotion }) => (
  <div className="bg-white p-4 rounded-xl shadow mt-6">
    <h2 className="text-lg font-semibold mb-3">Promotion Status</h2>
    {promotion?.isActive ? (
      <div>
        <p className="text-green-600">Active promotion</p>
        <p className="text-sm text-gray-600">
          Active until: dayjs({promotion.endAt}).format("ddd, DD/MM/YYYY")
        </p>
        <a href="/promotion/extend" className="text-blue-500 text-sm mt-3 block">
          Extend promotion →
        </a>
      </div>
    ) : (
      <div>
        <p className="text-gray-500 text-sm">No active promotion</p>
        <a href="/promotion/new" className="text-blue-500 text-sm mt-3 block">
          Add new promotion →
        </a>
      </div>
    )}
  </div>
);

export default PromotionStatus;
