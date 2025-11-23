import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const PTEducation = ({ education }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean">Education</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {!education || education.length === 0 ? (
            <p className="text-gray-700 text-sm md:text-base">No education information available.</p>
          ) : (
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                  <p className="text-gray-600 text-sm">{edu.field}</p>
                  <p className="text-gray-600 text-sm">{edu.institution}</p>
                  <p className="text-gray-500 text-sm">{edu.startYear} - {edu.endYear}</p>
                  {edu.certificateUrl && (
                    <a
                      href={edu.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-car text-sm underline mt-1 block"
                    >
                      View Certificate
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default PTEducation;
