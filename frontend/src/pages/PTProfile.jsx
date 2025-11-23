import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

import {
  PTOverview,
  PTServices,
  PTExperience,
  PTEducation,
  PTAvailability,
  PTGallery,
  PTRatings,
} from "../components/profiles";

import avatarFallback from "../assets/avatar.jpg";
import { API_URL } from "../config/constants";

const PTProfile = () => {
  const { id } = useParams(); // user._id of PT to view
  const { user: loggedInUser } = useAuth(); // logged-in user for actions

  const [pt, setPt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPT = async () => {
      try {
        const res = await API.get(`/pts/${id}`);
        setPt(res.data); 
      } catch (err) {
        console.error("Error fetching PT profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPT();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!pt || !pt.ptProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Physiotherapist not found.
      </div>
    );
  }
console.log("PT", pt)
  const ptProfile = pt.ptProfile;
  const avatarSrc = pt.profileImageUrl ? `${API_URL}${pt.profileImageUrl}` : avatarFallback;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 mt-20">
      {/* Header */}
      <div className="relative bg-white shadow-md rounded-b-3xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 p-6">
          <img
            src={avatarSrc}
            alt={pt.fullName}
            className="w-32 h-32 rounded-full object-cover border-4 border-gold"
          />

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-black">{pt.fullName}</h1>

            <p className="text-sm md:text-base text-gray-600">
              {ptProfile.title || "Physiotherapist"}
              {ptProfile.yearsOfExperience ? ` | ${ptProfile.yearsOfExperience}+ Years Experience` : ""}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {pt.location?.region}, {pt.location?.district}
            </p>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              {loggedInUser.role !== "guest" && (
                <>
                  <button className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-tufts">
                    Book Appointment
                  </button>
                  <button className="btn btn-outline border border-caribbean text-caribbean px-4 py-2 rounded-lg hover:bg-caribbean hover:text-white">
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PTOverview overview={pt.bio} />
          <PTServices services={ptProfile.services} />
          <PTExperience experience={ptProfile.workExperience} />
          <PTEducation education={ptProfile.education} />
          <PTGallery gallery={ptProfile.gallery} />
          <PTRatings ratings={ptProfile.ratings} reviews={ptProfile.reviews} />
          <PTAvailability availability={ptProfile.availability} />
        </div>
      </div>
    </div>
  );
};

export default PTProfile;
