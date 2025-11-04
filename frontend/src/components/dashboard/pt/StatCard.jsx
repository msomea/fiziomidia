import React from "react";

const StatCard = ({ title, value }) => (
  <div className="bg-white p-4 rounded-xl shadow text-center">
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
  </div>
);

export default StatCard;
