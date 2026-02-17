import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const PTAvailability = ({ availability }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  if (!availability) return null;

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean">{t("availability")}</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="space-y-2">
          <p className="text-gray-700 text-sm">
           {availability.isAcceptingNewPatients ? t("accepting_new_patients") : t("not_accepting_new_patients")}
          </p>
          {!availability.isAcceptingNewPatients && availability.nextAvailableDate && (
            <p className="text-gray-700 text-sm">
              {t("next_available_date")}: {dayjs(availability.nextAvailableDate).format("DD MMM YYYY")}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default PTAvailability;
