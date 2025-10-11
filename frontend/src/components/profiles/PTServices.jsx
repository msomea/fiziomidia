import React from "react";
import { CheckCircle } from "lucide-react";

const PTServices = () => {
  const services = [
    "Orthopedic Rehabilitation",
    "Post-Surgery Therapy",
    "Sports Injury Management",
    "Back & Neck Pain Treatment",
    "Neurological Rehabilitation",
    "Manual Therapy & Massage",
  ];

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Services</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {services.map((service, i) => (
          <li key={i} className="flex items-center gap-2 text-gray-700">
            <CheckCircle className="w-5 h-5 text-caribbean" />
            {service}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PTServices;
