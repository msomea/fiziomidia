import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import dayjs from "dayjs";

const PTExperience = ({ experience }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean">Work Experience</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {!experience || experience.length === 0 ? (
            <p className="text-gray-700 text-sm md:text-base">No work experience available.</p>
          ) : (
            <div className="space-y-4">
              {experience.map((job, index) => {
                const start = job.startDate ? dayjs(job.startDate).format("MMM YYYY") : "";
                const end = job.current ? "Present" : job.endDate ? dayjs(job.endDate).format("MMM YYYY") : "";

                return (
                  <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <h3 className="font-medium text-gray-900">{job.position}</h3>
                    <p className="text-gray-600 text-sm">{job.institution}</p>
                    <p className="text-gray-500 text-sm">{start} - {end}</p>
                    {job.description && (
                      <p className="text-gray-700 text-sm mt-1">{job.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default PTExperience;
