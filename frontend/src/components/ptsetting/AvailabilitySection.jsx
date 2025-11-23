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
        <div className="mt-4 space-y-4">

          {/* Accepting New Patients */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="availability.isAcceptingNewPatients"
              checked={formData.availability?.isAcceptingNewPatients || false}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: "availability.isAcceptingNewPatients",
                    value: e.target.checked,
                  }
                })
              }
              className="checkbox checkbox-primary"
            />
            <span className="text-gray-700">Accepting New Patients</span>
          </label>

          {/* Next Available Date */}
          <div>
            <label className="text-gray-700 font-medium">
              Next Available Date
            </label>
            <input
              type="date"
              name="availability.nextAvailableDate"
              value={
                formData.availability?.nextAvailableDate
                  ? formData.availability.nextAvailableDate.split("T")[0]
                  : ""
              }
              onChange={handleChange}
              className="input input-bordered w-full mt-1"
            />
          </div>

        </div>
      )}
    </div>
  );
};

export default AvailabilitySection;
