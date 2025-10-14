import React from "react";
import { getProfile, updateProfile, getUserById } from "../api/profile";

// Fetch current PT profile
useEffect(() => {
  const fetchProfile = async () => {
    const data = await getProfile();
    setProfile(data);
  };
  fetchProfile();
}, []);

const handleSave = async (updatedData) => {
  await updateProfile(updatedData);
};

// Fetch any PT profile by ID (for public profile pages)
useEffect(() => {
  const fetchPTProfile = async () => {
    const data = await getUserById(ptId); // ptId from route param
    setProfile(data.user);
  };
  fetchPTProfile();
}, [ptId]);

// Sample education data
const PTEducation = () => {
  const education = [
    {
      degree: "MSc in Physiotherapy",
      institution: "University of Dar es Salaam",
      year: "2016",
    },
    {
      degree: "BSc in Physiotherapy",
      institution: "Kilimanjaro Christian Medical University",
      year: "2013",
    },
  ];

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Education</h2>
      <ul className="space-y-3">
        {education.map((edu, i) => (
          <li key={i}>
            <h3 className="font-medium text-black">{edu.degree}</h3>
            <p className="text-sm text-gray-600">{edu.institution}</p>
            <p className="text-xs text-gray-500">{edu.year}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PTEducation;
