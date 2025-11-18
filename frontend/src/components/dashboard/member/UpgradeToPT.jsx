import React, { useState } from "react";
import { useNavigate } from "react-router";
import API from "../../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { Loader2 } from "lucide-react";

const UpgradeToPT = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    institution: "",
    isPrivatePractice: true,
    licenseNumber: "",
    speciality: "",
    yearsOfExperience: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const upgradeData = {
        upgradeToPhysiotherapist: true,
        ptProfile: {
          institution: formData.institution,
          isPrivatePractice: formData.isPrivatePractice,
          licenseNumber: formData.licenseNumber,
          speciality: formData.speciality.split(",").map((s) => s.trim()),
          yearsOfExperience: formData.yearsOfExperience,
          bio: formData.bio,
        },
      };

      const response = await API.put("/users/profile", upgradeData);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("You are now a Physiotherapist!");
      navigate(`/dashboard/pt/${updatedUser._id}`);
    } catch (err) {
      console.error("Upgrade failed:", err);
      toast.error(err.response?.data?.error || "Failed to upgrade to Physiotherapist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 mt-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Upgrade to Physiotherapist
        </h2>

        <form onSubmit={handleUpgradeSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Institution"
            value={formData.institution}
            onChange={(e) =>
              setFormData({ ...formData, institution: e.target.value })
            }
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="text"
            placeholder="License Number"
            value={formData.licenseNumber}
            onChange={(e) =>
              setFormData({ ...formData, licenseNumber: e.target.value })
            }
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="text"
            placeholder="Speciality (comma separated)"
            value={formData.speciality}
            onChange={(e) =>
              setFormData({ ...formData, speciality: e.target.value })
            }
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

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/member")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
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
