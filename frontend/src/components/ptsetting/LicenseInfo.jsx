import React, { useState, useEffect } from "react";
import { ChevronDown, X, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { ASSET_URL } from "../../config/constants";
import { useTranslation } from "react-i18next";

const LicenseInfo = ({ formData, setFormData, setLicenseFile }) => {
  const { t } = useTranslation();

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
      toast.error(t("select_pdf_image"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("file_under_2mb"));
      return;
    }

    setLicenseFile(file);

    setNewLicense((prev) => ({
      ...prev,
      licenseFile: file,
      licenseFileUrl: null,
      licenseFileType: file.type,
    }));

    toast.success(t("license_selected"));
  };

  // Add a license entry
  const addLicense = () => {
    if (!newLicense.licenseNumber || !newLicense.licenseFile) {
      toast.error(t("enter_license_number_file"));
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

    toast.success(t("license_added"));
  };

  // Remove a license
  const removeLicense = (index) => {
    const updated = licenseList.filter((_, i) => i !== index);
    setLicenseList(updated);
    setFormData((prev) => ({ ...prev, licenses: updated }));
    toast.success(t("license_removed"));
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t("license_info")}
        </h2>
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
                    {t("license_number")}: {license.licenseNumber}
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
                    {t("status")}: {t(license.verificationStatus)}
                  </p>

                  <p className="inline-block text-sm text-tufts">{license.licenseFileType}</p>
                  <p className="text-sm text-gray-900">{license.verificationNotes}</p>

                  {license.licenseFileUrl && (
                    <a
                      href={license.licenseFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-caribbean underline mt-2 block"
                    >
                      {t("view_document")}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New License */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("license_number")}
            </label>
            <input
              type="text"
              name="licenseNumber"
              value={newLicense.licenseNumber}
              onChange={handleNewLicenseChange}
              placeholder={t("enter_license_number")}
              className="input input-bordered w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("license_document")}
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
            {t("add_license")}
          </button>
        </div>
      )}
    </div>
  );
};

export default LicenseInfo;
