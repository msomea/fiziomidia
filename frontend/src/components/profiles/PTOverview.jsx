import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const PTOverview = ({ overview }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean">About</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <p className="text-gray-700 leading-relaxed text-sm md:text-base">{overview || "No overview available."}</p>
      )}
    </section>
  );
};

export default PTOverview;
