import React from "react";

const AvailabilitySection = ({ formData, handleChange }) => (
  <div className="card bg-white shadow-md p-6">
    <h2 className="text-xl font-bold mb-4 text-caribbean">Availability</h2>
    <textarea
      name="availability"
      value={formData.availability}
      onChange={handleChange}
      className="textarea textarea-bordered w-full h-24"
    />
  </div>
);

export default AvailabilitySection;
