import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const PTAvailability = ({ availability, workingHours }) => {
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
        <div className="space-y-3">
          <p className="text-gray-700 text-sm">
           {availability.isAcceptingNewPatients ? t("accepting_new_patients") : t("not_accepting_new_patients")}
          </p>
          {!availability.isAcceptingNewPatients && availability.nextAvailableDate && (
            <p className="text-gray-700 text-sm">
              {t("next_available_date")}: {dayjs(availability.nextAvailableDate).format("DD MMM YYYY")}
            </p>
          )}
          {availability.isAcceptingNewPatients && workingHours && workingHours.length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">{t("working_hours")}</h3>
              <div className="space-y-1">
                {workingHours
                  .filter(wh => wh.isAvailable)
                  .sort((a, b) => {
                    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    return dayOrder.indexOf(a.dayOfWeek.toLowerCase()) - dayOrder.indexOf(b.dayOfWeek.toLowerCase());
                  })
                  .map((wh, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-600">
                      <span className="capitalize">{wh.dayOfWeek}</span>
                      <span>{wh.from} - {wh.to}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PTAvailability;
