import React, { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const Languages = ({ formData, setFormData }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [newLanguage, setNewLanguage] = useState({ name: "", proficiency: "" });
  const [languages, setLanguages] = useState(formData.languages || []);

  const addLanguage = () => {
    if (!newLanguage.name || !newLanguage.proficiency) {
      toast.error(t("fill_language_proficiency"));
      return;
    }
    const updated = [...languages, newLanguage];
    setLanguages(updated);
    setFormData(prev => ({ ...prev, languages: updated }));
    setNewLanguage({ name: "", proficiency: "" });
    toast.success(t("language_added"));
  };

  const removeLanguage = (index) => {
    const updated = languages.filter((_, i) => i !== index);
    setLanguages(updated);
    setFormData(prev => ({ ...prev, languages: updated }));
    toast.success(t("language_removed"));
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">{t("languages")}</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {languages.map((lang, i) => (
            <div key={i} className="flex justify-between items-center p-2 bg-alice rounded-lg">
              <span>{lang.name} ({lang.proficiency})</span>
              <button
                onClick={() => removeLanguage(i)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} /> {t("remove")}
              </button>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t("language")}
              name="name"
              value={newLanguage.name}
              onChange={(e) => setNewLanguage(prev => ({ ...prev, name: e.target.value }))}
              className="input input-bordered w-full text-sm"
            />
            <input
              type="text"
              placeholder={t("proficiency_example")}
              name="proficiency"
              value={newLanguage.proficiency}
              onChange={(e) => setNewLanguage(prev => ({ ...prev, proficiency: e.target.value }))}
              className="input input-bordered w-full text-sm"
            />
          </div>

          <button
            type="button"
            onClick={addLanguage}
            className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {t("add_language")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Languages;
