import React from "react";
import { Star } from "lucide-react";
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

// Sample reviews data
const PTReviews = () => {
  const reviews = [
    {
      name: "Anna John",
      text: "Very professional and caring. Helped me recover quickly from my shoulder injury!",
      rating: 5,
    },
    {
      name: "Peter Mwakyusa",
      text: "The exercises were effective and easy to follow. Highly recommended.",
      rating: 4,
    },
  ];

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Reviews</h2>
      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div key={i} className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium text-black">{r.name}</p>
              <div className="flex">
                {[...Array(5)].map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-4 h-4 ${
                      idx < r.rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                    fill={idx < r.rating ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-700">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PTReviews;
