import React, { useState } from "react";
import { ChevronDown, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OverviewSection({ formData, handleChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="card bg-white shadow-md p-6">

      {/* HEADER (CLICK TO COLLAPSE) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean flex items-center gap-2">
          <User className="w-5 h-5" />
          {t("overview")}
        </h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* COLLAPSIBLE CONTENT */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[400px] mt-4" : "max-h-0"
        }`}
      >
        <textarea
          name="bio"
          value={formData.bio || ""}
          onChange={handleChange}
          placeholder="Write a short overview about yourself..."
          className="textarea textarea-bordered w-full h-32"
        ></textarea>
      </div>

    </div>
  );
}
