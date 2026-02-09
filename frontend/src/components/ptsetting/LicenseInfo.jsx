import React, { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import toast from "react-hot-toast";
import { ASSET_URL } from "../../config/constants";


const LicenseInfo = ({ formData, setFormData, setLicenseFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [licenseList, setLicenseList] = useState(formData.licenses || []);
  


  const [newLicense, setNewLicense] = useState({
    licenseNumber: "",
    licenseFile: null,
    licenseFileType: "",
    verificationStatus: "pending",
    verificationNotes: "",
    verified: false,
    submittedAt: Date.now(),
  });

  // Sync child list when parent updates
  useEffect(() => {
    setLicenseList(formData.licenses || []);
  }, [formData.licenses]);

  // Text inputs
  const handleNewLicenseChange = (e) => {
    const { name, value } = e.target;
    setNewLicense((prev) => ({ ...prev, [name]: value }));
  };

  // File input
  const handleLicenseFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  if (!validTypes.includes(file.type)) {
    toast.error("Please select a PDF or image file");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    toast.error("File must be under 2MB");
    return;
  }

  // Pass file to parent
  setLicenseFile(file);

  // FIX: Save the actual file object inside newLicense
  setNewLicense((prev) => ({
    ...prev,
    licenseFile: file,
    // Do not assume backend filename; leave URL empty until server returns
    licenseFileUrl: null,
    licenseFileType: file.type,
  }));

  toast.success("License document selected");
};


  // Add a license entry
  const addLicense = () => {
    if (!newLicense.licenseNumber || !newLicense.licenseFile) {
      toast.error("Please enter license number and select a file");
      return;
    }

    const updated = [...licenseList, newLicense];

    setLicenseList(updated);
    setFormData((prev) => ({ ...prev, licenses: updated }));

    // Reset
    setNewLicense({
      licenseNumber: "",
      licenseFile: null,
      licenseFileType: "",
      verificationStatus: "pending",
      verificationNotes: "",
      verified: false,
      submittedAt: Date.now(),
    });

    toast.success("License added");
  };

  // Remove a license
  const removeLicense = (index) => {
    const updated = licenseList.filter((_, i) => i !== index);
    setLicenseList(updated);
    setFormData((prev) => ({ ...prev, licenses: updated }));
    toast.success("License removed");
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">License Information</h2>
        <ChevronDown
          className={`h-5 w-5 text-caribbean transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-6">

          {/* Existing Licenses */}
          {licenseList.length > 0 && (
            <div className="space-y-4">
              {licenseList.map((license, index) => (
                <div
                  key={index}
                  className="p-4 bg-alice rounded-lg border border-gray-200 relative"
                >
                  <button
                    type="button"
                    onClick={() => removeLicense(index)}
                    className="absolute top-2 right-2 text-red-500"
                  >
                    <X size={18} />
                  </button>

                  <p className="font-semibold text-tufts">
                    License Number: {license.licenseNumber}
                  </p>

                  <p
                    className={`text-xs font-medium px-2 py-1 rounded inline-block text-tufts
                      ${
                        license.verificationStatus === "approved"
                          ? "bg-green-100 text-green-700"
                          : license.verificationStatus === "rejected"
                          ? "bg-red-100 text-red-700"
                          : license.verificationStatus === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    Status: {license.verificationStatus}
                  </p>
                  <p className="inline-block text-sm text-tufts"> {license.licenseFileType}</p>
                  <p className="text-sm text-gray-900">{license.verificationNotes}</p>
                 
                  {license.licenseFileUrl && (
                    <a
                      href={license.licenseFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-caribbean underline mt-2 block"
                    >
                      View Document
                    </a>
                    
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New License */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number
            </label>
            <input
              type="text"
              name="licenseNumber"
              value={newLicense.licenseNumber}
              onChange={handleNewLicenseChange}
              placeholder="Enter your license number"
              className="input input-bordered w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Document (PDF or Image)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleLicenseFileChange}
              className="file-input file-input-bordered w-full"
            />
          </div>

          <button
            type="button"
            onClick={addLicense}
            className="btn bg-caribbean text-white hover:bg-tufts w-full"
          >
            Add License
          </button>
        </div>
      )}
    </div>
  );
};

export default LicenseInfo;
