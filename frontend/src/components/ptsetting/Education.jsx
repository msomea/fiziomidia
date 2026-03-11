import React, { useState, useEffect } from "react";
import { Plus, X, ChevronDown, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const Education = ({ formData, setFormData }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [educationList, setEducationList] = useState(formData.education || []);
  const [newEducation, setNewEducation] = useState({
    institution: "",
    degree: "",
    field: "",
    startYear: "",
    endYear: "",
    certificateUrl: "",
  });

  useEffect(() => {
    setEducationList(formData.education || []);
  }, [formData.education]);

  const handleNewEducationChange = (e) => {
    const { name, value } = e.target;
    setNewEducation((prev) => ({ ...prev, [name]: value }));
  };

  const validateYears = (start, end) => {
    if (!start) return false;
    if (!end) return true;
    return parseInt(start) <= parseInt(end);
  };

  const addEducation = () => {
    if (!newEducation.institution || !newEducation.degree || !newEducation.startYear) {
      toast.error(t("please_fill_required"));
      return;
    }

    if (newEducation.endYear && !validateYears(newEducation.startYear, newEducation.endYear)) {
      toast.error(t("end_after_start"));
      return;
    }

    const updated = [...educationList, newEducation];
    setEducationList(updated);
    setFormData((prev) => ({ ...prev, education: updated }));

    setNewEducation({
      institution: "",
      degree: "",
      field: "",
      startYear: "",
      endYear: "",
      certificateUrl: "",
    });

    toast.success(t("education_added"));
  };

  const removeEducation = (index) => {
    const updated = educationList.filter((_, i) => i !== index);
    setEducationList(updated);
    setFormData((prev) => ({ ...prev, education: updated }));
    toast.success(t("education_removed"));
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="card bg-white shadow-md p-6 mb-4">

      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          {t("education")}
        </h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Collapsible Body */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[2000px] mt-4" : "max-h-0"
        }`}
      >
        {/* Education List */}
        <div className="mb-6 space-y-4">
          {educationList.map((edu, index) => (
            <div key={index} className="flex items-start justify-between p-4 bg-alice rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-tufts">{edu.degree}</h3>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={18} /> {t("remove")}
                  </button>
                </div>

                <p className="text-sm font-medium text-gray-700">{edu.institution}</p>
                <p className="text-sm text-gray-600">
                  {edu.startYear}
                  {edu.endYear ? ` - ${edu.endYear}` : ""}
                </p>

                {edu.field && (
                  <p className="text-sm text-gray-600">{t("field_of_study")}: {edu.field}</p>
                )}

                {edu.certificateUrl && (
                  <a
                    href={edu.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-caribbean hover:text-tufts mt-2 inline-block"
                  >
                    {t("view_certificate")}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Education */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="institution"
              value={newEducation.institution}
              onChange={handleNewEducationChange}
              placeholder={t("institution_name")}
              className="input input-bordered w-full text-sm"
            />

            <input
              type="text"
              name="degree"
              value={newEducation.degree}
              onChange={handleNewEducationChange}
              placeholder={t("degree_title")}
              className="input input-bordered w-full text-sm"
            />

            <input
              type="text"
              name="field"
              value={newEducation.field}
              onChange={handleNewEducationChange}
              placeholder={t("field_of_study")}
              className="input input-bordered w-full text-sm"
            />

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <select
                name="startYear"
                value={newEducation.startYear}
                onChange={handleNewEducationChange}
                className="select select-bordered w-full text-sm"
              >
                <option value="">{t("start_year")}</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                name="endYear"
                value={newEducation.endYear}
                onChange={handleNewEducationChange}
                className="select select-bordered w-full text-sm"
              >
                <option value="">{t("end_year")}</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="url"
              name="certificateUrl"
              value={newEducation.certificateUrl}
              onChange={handleNewEducationChange}
              placeholder={t("certificate_url")}
              className="input input-bordered w-full text-sm md:col-span-2"
            />
          </div>

          <button
            type="button"
            onClick={addEducation}
            className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {t("add_education")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Education;
