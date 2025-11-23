import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const PTServices = ({ services }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean">Services</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {!services || services.length === 0 ? (
            <p className="text-gray-700 text-sm md:text-base">No services available.</p>
          ) : (
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    <span className="text-gray-600 text-sm">{service.duration} min</span>
                  </div>
                  {service.description && (
                    <p className="text-gray-700 text-sm mt-1">{service.description}</p>
                  )}
                  <p className="text-gray-800 font-semibold mt-1">Tsh {service.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default PTServices;
