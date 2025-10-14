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

// Sample overview data
const PTOverview = () => {
  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">About</h2>
      <p className="text-gray-700 leading-relaxed text-sm md:text-base">
        I’m a licensed physiotherapist specializing in orthopedic rehabilitation,
        manual therapy, and sports injury recovery. I believe in a personalized,
        movement-based approach to restore strength and function.
      </p>
    </section>
  );
};

export default PTOverview;
