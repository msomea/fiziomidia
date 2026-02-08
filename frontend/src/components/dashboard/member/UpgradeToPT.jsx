import React, { useState } from "react";
import { useNavigate } from "react-router";
import API from "../../../api/axios";
import { API_URL } from "../../../config/constants";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { Loader2 } from "lucide-react";

const UpgradeToPT = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [licenseFile, setLicenseFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speciality, setSpeciality] = useState([]);
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

      // Tell backend it's an upgrade request
      body.append("upgradeToPhysiotherapist", true);

      // --- Basic PT profile fields ---
      body.append("ptProfile[institution]", formData.institution || "");
      body.append("ptProfile[isPrivatePractice]", formData.isPrivatePractice);
      body.append("ptProfile[yearsOfExperience]", formData.yearsOfExperience || "");
      body.append("ptProfile[bio]", formData.bio || "");

      // --- Speciality array ---
      const specialityArray = formData.speciality
        ? formData.speciality.split(",").map((s) => s.trim())
        : [];

      specialityArray.forEach((value, index) => {
        body.append(`ptProfile[speciality][${index}]`, value);
      });

      // --- Single License (Upgrade requires only one) ---
      body.append(`ptProfile[licenses][0][licenseNumber]`, formData.licenseNumber);

      // File type from user's selected file (if available)
      if (licenseFile) {
        body.append(`ptProfile[licenses][0][licenseFileType]`, licenseFile.type);
      }

      // Default verification status
      body.append(`ptProfile[licenses][0][verificationStatus]`, "pending");
      body.append(`ptProfile[licenses][0][verified]`, false);

      // --- Attach License File (REQUIRED) ---
      if (licenseFile) {
        body.append("licenseDocument", licenseFile);
      } else {
        toast.error("Please upload your license document");
        setLoading(false);
        return;
      }

      const response = await API.put(`${API_URL}/users/profile`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Your upgrade request has been submitted. Await admin approval.");
      navigate(`/dashboard/member/${updatedUser._id}`);

    } catch (err) {
      console.error("Upgrade failed:", err);
      toast.error(err.response?.data?.error || "Failed to submit upgrade request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 mt-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl text-caribbean font-semibold text-center mb-6">
          Upgrade to Physiotherapist
        </h2>

        <form onSubmit={handleUpgradeSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Institution"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="text"
            placeholder="License Number"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="text"
            placeholder="Speciality (comma separated)"
            value={formData.speciality}
            onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="number"
            placeholder="Years of Experience"
            value={formData.yearsOfExperience}
            onChange={(e) =>
              setFormData({ ...formData, yearsOfExperience: e.target.value })
            }
            className="w-full border rounded-lg p-2"
            required
          />

          <textarea
            placeholder="Short Bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          {/* LICENSE DOCUMENT UPLOAD */}
          <div>
            <label className="block text-tufts font-medium mb-1">Upload License Document</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setLicenseFile(e.target.files[0])}
              className="w-full border rounded-lg p-2"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Accepted: PDF, JPG, JPEG, PNG
            </p>
          </div>

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/member")}
              className="px-4 py-2 bg-red-400 text-white border rounded-lg hover:bg-red-700"
              disabled={loading}
            >
              Cancel
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
                  <Loader2 className="animate-spin w-4 h-4" /> Processing...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpgradeToPT;
