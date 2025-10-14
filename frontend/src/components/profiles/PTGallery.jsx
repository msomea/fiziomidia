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

// Sample gallery data
const PTGallery = () => {
  const images = [
    "/images/gallery1.jpg",
    "/images/gallery2.jpg",
    "/images/gallery3.jpg",
  ];

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Gallery</h2>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Gallery ${i + 1}`}
            className="rounded-lg object-cover w-full h-28 md:h-40"
          />
        ))}
      </div>
    </section>
  );
};

export default PTGallery;
