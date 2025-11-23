import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const AvailabilitySection = ({ formData, handleChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const availability = formData.availability || {
    isAcceptingNewPatients: true,
    nextAvailableDate: null,
  };

  const updateAvailability = (field, value) => {
    let updated = { ...availability, [field]: value };

    // Auto-set nextAvailableDate to null if accepting patients
    if (field === "isAcceptingNewPatients" && value === true) {
      updated.nextAvailableDate = null;
    }

    handleChange({
      target: {
        name: "availability",
        value: updated,
      },
    });
  };

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
              checked={availability.isAcceptingNewPatients}
              onChange={(e) =>
                updateAvailability("isAcceptingNewPatients", e.target.checked)
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
              disabled={availability.isAcceptingNewPatients}
              value={
                availability.nextAvailableDate
                  ? availability.nextAvailableDate.split("T")[0]
                  : ""
              }
              onChange={(e) =>
                updateAvailability("nextAvailableDate", e.target.value)
              }
              className={`input input-bordered w-full mt-1 ${
                availability.isAcceptingNewPatients ? "opacity-50" : ""
              }`}
            />
            {availability.isAcceptingNewPatients && (
              <p className="text-sm text-gray-500 mt-1">
                Since you are accepting new patients, next available date is not required.
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default AvailabilitySection;
