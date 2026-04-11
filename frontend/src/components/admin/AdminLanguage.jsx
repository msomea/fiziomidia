import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateLanguage } from "../../api/users";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";

const AdminLanguage = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    if (user?.language) setSelectedLanguage(user.language);
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (selectedLanguage === user.language) {
      toast(t("no_language_change"));
      return;
    }

    setLoading(true);
    try {
      const data = await updateLanguage(selectedLanguage);

      if (data.success) {
        const updatedUser = { ...user, language: data.language };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        i18n.changeLanguage(data.language);
        toast.success(t("language_updated_success"));
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Language update error:", err);
      toast.error(err.response?.data?.error || t("failed_update_language"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-white shadow-md p-6 mt-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">{t("default_language")}</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4"> {/* <-- div instead of form */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {t("select_language")}
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="en">{t("english")}</option>
              <option value="sw">{t("swahili")}</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setSelectedLanguage(user.language);
                setIsOpen(false);
              }}
              className="btn bg-red-300 flex-1 hover:bg-red-400 text-white"
              disabled={loading}
            >
              {t("cancel")}
            </button>

            <button
              type="button"  // <-- changed from "submit" to "button"
              onClick={handleSubmit} // <-- manually call handler
              className="btn bg-caribbean text-white hover:bg-tufts flex-1"
              disabled={loading}
            >
              {loading ? t("updating") : t("update_language")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLanguage;