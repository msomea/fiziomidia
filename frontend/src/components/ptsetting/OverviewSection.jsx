import React from "react";

const OverviewSection = ({ formData, handleChange }) => (
  <div className="card bg-white shadow-md p-6">
    <h2 className="text-xl font-bold mb-4 text-caribbean">Overview</h2>
    <textarea
      name="bio"
      value={formData.bio || ""}
      onChange={handleChange}
      className="textarea textarea-bordered w-full h-32"
    ></textarea>
  </div>
);

export default OverviewSection;
