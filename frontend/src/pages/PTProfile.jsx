import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { fetchPTById } from "../api/pts";
import { useNavigate } from "react-router";
import { Loader2, Heart } from "lucide-react";
import { toggleSavePT } from "../api/users";
import toast from "react-hot-toast";

import {
  PTOverview,
  PTServices,
  PTExperience,
  PTEducation,
  PTAvailability,
  PTGallery,
  PTRatings,
  PTClinics,
} from "../components/profiles";

import avatarFallback from "../assets/avatar.jpg";

const PTProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // PT ID
  const { user: loggedInUser } = useAuth();
  const { t } = useTranslation();

  const [pt, setPt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchPT = async () => {
      try {
        const ptData = await fetchPTById(id);
        setPt(ptData); 
        const saved = loggedInUser?.savedPTs?.some((savedPT) => savedPT._id === id);
        setIsSaved(!!saved);
      } catch (err) {
        console.error("Error fetching PT profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPT();
  }, [id, loggedInUser]);

  const handleSave = async () => {
    if (!pt) return;

    const prevState = isSaved;
    setIsSaved(!prevState);

    const toastId = toast(
      (tObj) => (
        <div className="flex items-center justify-between gap-4">
          <span>{!prevState ? t("saved_pt") : t("removed_saved_pt")}</span>
          <button
            onClick={() => {
              setIsSaved(prevState);
              toast.dismiss(tObj.id);
            }}
            className="text-caribbean font-semibold hover:underline"
          >
            {t("undo")}
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    setTimeout(async () => {
      try {
        await toggleSavePT(pt._id);
      } catch (err) {
        console.error("Failed to update saved PT:", err);
        setIsSaved(prevState);
        toast.error(t("failed_save_pt"));
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t("loading_pt_profile")}
        </p>
      </div>
    );
  }

  if (!pt || !pt.ptProfile) {
    return (
      <div className="min-h-screen mt-20 flex items-center justify-center text-red-500">
        {t("pt_not_found")}
      </div>
    );
  }

  const ptProfile = pt.ptProfile;
  const avatarSrc = pt.profileImageUrl || avatarFallback;

  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 mt-14">
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
              {ptProfile.title || t("physiotherapist")}
              {ptProfile.yearsOfExperience
                ? ` | ${ptProfile.yearsOfExperience}+ ${t("years_experience")}`
                : ""}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {pt.location?.region
                ? `${pt.location.region}`
                : ""}
              {pt.location?.district
                ? `, ${pt.location.district}`
                : ""}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {loggedInUser.role !== "guest" && id !== loggedInUser._id ? (
                <>
                  <button 
                    onClick={() => navigate(`/appointments/book/${pt._id}`)}
                    className="bg-caribbean text-white px-4 py-2 rounded-lg hover:bg-tufts transition"
                  >
                    {t("book_appointment")}
                  </button>

                  <Link
                    to={`/messages/user/${pt._id}`}
                    className="border border-caribbean text-caribbean px-4 py-2 rounded-lg hover:bg-caribbean hover:text-white transition"
                  >
                    {t("message")}
                  </Link>

                  <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      isSaved
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <Heart size={18} className={isSaved ? "text-red-600" : "text-white"} />
                    {isSaved ? t("saved") : t("save_pt")}
                  </button>
                </>
              ) : loggedInUser.role === "guest" ? (
                <p className="text-sm text-gray-500 italic">
                  {t("login_to_message_or_book")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PTOverview overview={pt.bio} />
          <PTServices services={ptProfile.services} />
          <PTExperience experience={ptProfile.workExperience} />
          <PTEducation education={ptProfile.education} />
          <PTClinics clinicIds={ptProfile.clinicIds} ptId={id} />
          <PTGallery gallery={ptProfile.gallery} />
          <PTRatings ratings={ptProfile.ratings} reviews={ptProfile.reviews} />
          <PTAvailability availability={ptProfile.availability} workingHours={ptProfile.workingHours}/>
        </div>
      </div>
    </div>
  );
};

export default PTProfile;
