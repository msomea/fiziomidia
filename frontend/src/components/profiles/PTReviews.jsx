import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";

const PTReviews = ({ ptId, formData }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = ptId ? await getUserById(ptId) : await getProfile();
      setReviews(data.user?.reviews || []);
    };
    fetchProfile();
  }, [ptId]);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Reviews</h2>
      {reviews.length ? (
        <ul className="space-y-3">
          {reviews.map((r, i) => (
            <li key={i}>
              <p className="text-sm text-gray-700">{r.comment}</p>
              <span className="text-xs text-gray-500">{r.reviewer}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No reviews yet.</p>
      )}
    </section>
  );
};

export default PTReviews;
