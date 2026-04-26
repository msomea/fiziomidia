import React, { useState } from "react";
import { useNavigate } from "react-router";
import { updateProfile } from "../../../api/users";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const UpgradeToPT = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [licenseFile, setLicenseFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    institution: "",
    isPrivatePractice: true,
    licenseNumber: "",
    speciality: "",
    yearsOfExperience: "",
    bio: "",
  });

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = new FormData();

      // Mark upgrade request
      body.append("upgradeToPhysiotherapist", true);

      // PT profile fields
      body.append("ptProfile[institution]", formData.institution || "");
      body.append("ptProfile[isPrivatePractice]", formData.isPrivatePractice);
      body.append("ptProfile[yearsOfExperience]", formData.yearsOfExperience || "");
      body.append("ptProfile[bio]", formData.bio || "");

      // Speciality array
      const specialityArray = formData.speciality
        ? formData.speciality.split(",").map((s) => s.trim())
        : [];
      specialityArray.forEach((value, index) => {
        body.append(`ptProfile[speciality][${index}]`, value);
      });

      // License number
      body.append(`ptProfile[licenses][0][licenseNumber]`, formData.licenseNumber);

      // License file
      if (licenseFile) {
        body.append("licenseDocument", licenseFile);
      } else {
        toast.error(t("upload_license_required"));
        setLoading(false);
        return;
      }

      const updatedUser = await updateProfile(body);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success(t("upgrade_request_submitted"));
      navigate(`/dashboard/member/${updatedUser._id}`);
    } catch (err) {
      console.error("Upgrade failed:", err);
      toast.error(err.response?.data?.error || t("upgrade_request_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 mt-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl text-caribbean font-semibold text-center mb-6">
          {t("upgrade_to_pt")}
        </h2>

        <form onSubmit={handleUpgradeSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t("institution")}
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="text"
            placeholder={t("license_number")}
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="text"
            placeholder={t("speciality_comma")}
            value={formData.speciality}
            onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="number"
            placeholder={t("years_of_experience")}
            value={formData.yearsOfExperience}
            onChange={(e) =>
              setFormData({ ...formData, yearsOfExperience: e.target.value })
            }
            className="w-full border rounded-lg p-2"
            required
          />

          <textarea
            placeholder={t("short_bio")}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          {/* LICENSE DOCUMENT UPLOAD */}
          <div>
            <label className="block text-tufts font-medium mb-1">{t("upload_license")}</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setLicenseFile(e.target.files[0])}
              className="w-full border rounded-lg p-2"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {t("accepted_file_types")}
            </p>
          </div>

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-red-400 text-white border rounded-lg hover:bg-red-700"
              disabled={loading}
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              className={`px-4 py-2 bg-caribbean text-white rounded-lg hover:bg-[#03bb74] flex items-center gap-2 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" /> {t("processing")}
                </>
              ) : (
                t("submit")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpgradeToPT;
