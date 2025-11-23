import React from "react";

const PTOverview = ({ overview }) => {
  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-caribbean mb-3">About</h2>
      <p className="text-gray-700 leading-relaxed text-sm md:text-base">
        {overview || "No overview available."}
      </p>
    </section>
  );
};

export default PTOverview;
