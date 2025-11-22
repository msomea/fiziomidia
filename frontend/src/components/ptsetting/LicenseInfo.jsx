import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const LicenseInfo = ({ formData, handleChange, handleLicenseFileChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">License Information</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number
            </label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber || ""}
              onChange={handleChange}
              placeholder="Enter your license number"
              className="input input-bordered w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Document
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleLicenseFileChange}
              className="file-input file-input-bordered w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload your license document (PDF or image format)
            </p>
          </div>

          {formData.licenseVerificationStatus && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                formData.licenseVerificationStatus === "approved"
                  ? "bg-green-50 text-green-700"
                  : formData.licenseVerificationStatus === "rejected"
                  ? "bg-red-50 text-red-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              <p className="font-medium">
                Verification Status:{" "}
                {formData.licenseVerificationStatus.charAt(0).toUpperCase() +
                  formData.licenseVerificationStatus.slice(1)}
              </p>
              {formData.licenseVerificationNotes && (
                <p className="text-sm mt-1">{formData.licenseVerificationNotes}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LicenseInfo;
