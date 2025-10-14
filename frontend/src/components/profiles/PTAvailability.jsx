import React from "react";
import { CalendarDays, Clock } from "lucide-react";
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

// Sample availability data
const PTAvailability = () => {
  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Availability</h2>

      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-5 h-5 text-caribbean" />
        <p className="text-sm text-gray-700">Monday – Saturday</p>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-caribbean" />
        <p className="text-sm text-gray-700">8:00 AM – 5:00 PM</p>
      </div>

      <button className="btn btn-block mt-4 bg-caribbean text-white hover:bg-[#03bb74]">
        Book Appointment
      </button>
    </section>
  );
};

export default PTAvailability;
