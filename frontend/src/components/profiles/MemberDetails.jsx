import React from "react";
import { getProfile, updateProfile, getUserById } from "../api/profile";

// Fetch current member profile
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

// Fetch any member profile by ID (for public profile pages)
useEffect(() => {
  const fetchMemberProfile = async () => {
    const data = await getUserById(memberId); // memberId from route param
    setProfile(data.user);
  };
  fetchMemberProfile();
}, [memberId]);


// Sample member details data
const MemberDetails = () => {
  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">About</h2>
      <p className="text-gray-700 leading-relaxed text-sm md:text-base">
        Hi, I’m Brian — passionate about fitness and recovery. I use FizioMidia
        to connect with physiotherapists and track my recovery journey.
      </p>
    </section>
  );
};

export default MemberDetails;
