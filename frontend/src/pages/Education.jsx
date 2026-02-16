// src/components/Education.jsx
import React from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const Education = () => {
  const { t } = useTranslation();
  
  const roles = [
    {
      title: t("supporter"),
      description: t("supporter_desc"),
      color: "#1ABC9C", // Caribbean green
    },
    {
      title: t("investor"),
      description: t("investor_desc"),
      color: "#3498DB", // Tufts blue
    },
    {
      title: t("collaborator"),
      description: t("collaborator_desc"),
      color: "#F39C12", // Caribbean sunset accent
    },
  ];
  return (
    <section className="education-section mt-8 py-16 px-4 md:px-16 bg-gradient-to-r from-[#E0F7FA] to-[#D0F0F7]">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-caribbean">
          {t("education_title")}
        </h2>
        <p className="mt-4 text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
          {t("education_desc")}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {roles.map((role) => (
          <div
            key={role.title}
            className="role-card rounded-2xl shadow-lg p-8 flex flex-col justify-between hover:scale-105 transition-transform duration-300"
            style={{ borderTop: `6px solid ${role.color}`, background: "white" }}
          >
            <div>
              <h3
                className="text-2xl md:text-3xl font-semibold mb-4"
                style={{ color: role.color }}
              >
                {role.title}
              </h3>
              <p className="text-gray-700 text-base md:text-lg">{role.description}</p>
            </div>
            <button
              className="mt-6 px-6 py-3 rounded-full font-semibold text-white"
              style={{ backgroundColor: role.color }}
              onClick={() =>
                toast.success(`${t("thank_you_interest")} ${role.title}!`)
              }
            >
              {t("join_now")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Education;
