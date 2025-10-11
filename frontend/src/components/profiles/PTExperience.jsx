import React from "react";

const PTExperience = () => {
  const experiences = [
    {
      title: "Senior Physiotherapist",
      place: "Tanzania Orthopaedic Institute",
      years: "2018 – Present",
      details: "Leading rehabilitation programs for orthopedic patients.",
    },
    {
      title: "Physiotherapist",
      place: "Muhimbili National Hospital",
      years: "2014 – 2018",
      details: "Worked with multidisciplinary teams for patient recovery plans.",
    },
  ];

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Experience</h2>
      <div className="space-y-4">
        {experiences.map((exp, i) => (
          <div key={i} className="border-l-4 border-caribbean pl-4">
            <h3 className="text-lg font-medium text-black">{exp.title}</h3>
            <p className="text-sm text-gray-600">{exp.place}</p>
            <p className="text-xs text-gray-500">{exp.years}</p>
            <p className="text-sm text-gray-700 mt-1">{exp.details}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PTExperience;
