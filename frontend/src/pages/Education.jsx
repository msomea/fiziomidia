// src/components/Education.jsx
import React from "react";
import toast from "react-hot-toast";

const roles = [
  {
    title: "Supporter",
    description:
      "Join FizioMidia in empowering physiotherapists and community members through educational resources and programs.",
    color: "#1ABC9C", // Caribbean green
  },
  {
    title: "Investor",
    description:
      "Invest in the growth of physiotherapy education and innovative solutions to improve community health.",
    color: "#3498DB", // Tufts blue
  },
  {
    title: "Collaborator",
    description:
      "Collaborate with us to develop courses, workshops, and initiatives that uplift physiotherapy knowledge.",
    color: "#F39C12", // Caribbean sunset accent
  },
];

const Education = () => {
  return (
    <section className="education-section py-16 px-4 md:px-16 bg-gradient-to-r from-[#E0F7FA] to-[#D0F0F7]">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-[#0E4D92]">
          Join FizioMidia in Educating the Community
        </h2>
        <p className="mt-4 text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
          Become a Supporter, Investor, or Collaborator to help physiotherapists
          and the community grow through knowledge, training, and innovation.
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
                toast.success(`Thank you for your interest as a ${role.title}!`)
              }
            >
              Join Now
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Education;
