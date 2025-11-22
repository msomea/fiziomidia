import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const AvailabilitySection = ({ formData, handleChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">Availability</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4">
          <textarea
            name="availability"
            value={formData.availability || ""}
            onChange={handleChange}
            className="textarea textarea-bordered w-full h-24"
          />
        </div>
      )}
    </div>
  );
};

export default AvailabilitySection;
