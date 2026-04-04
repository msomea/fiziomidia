import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import SkeletonProfessionalCard from "../../components/home/SkeletonProfessionalCard";
import { fetchPromotions } from "../../api/promotions"; 

const ITEMS_PER_PAGE = 4; // Bigger cards → fewer per page
const AUTO_PLAY_INTERVAL = 6000;

export default function ListPromotions() {
  const { t } = useTranslation();

  const [pts, setPts] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [page, setPage] = useState(0);
  const intervalRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemsRef = useRef(null);

  useEffect(() => {
    const fetchPromotionsData = async () => {
      try {
        const data = await fetchPromotions();
        setPts(data || []);
      } catch (err) {
        console.error(t("failed_load_promotions"), err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotionsData();
  }, [t]);

  const totalPages = Math.ceil(pts.length / ITEMS_PER_PAGE);

  useEffect(() => {
    startAutoPlay();

    if (itemsRef.current) {
      const height = itemsRef.current.offsetHeight;
      if (height > containerHeight) setContainerHeight(height);
    }
    return () => stopAutoPlay();
  }, [page, pts]);

  const startAutoPlay = () => {
    stopAutoPlay();
    if (totalPages > 1) {
      intervalRef.current = setInterval(() => {
        setPage((prev) => (prev + 1) % totalPages);
      }, AUTO_PLAY_INTERVAL);
    }
  };

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handlePrev = () => {
    stopAutoPlay();
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    stopAutoPlay();
    setPage((prev) => (prev + 1) % totalPages);
  };

  const currentItems = pts.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
    <section className="max-w-7xl mt-4 mx-auto px-4 py-14">
      <h2 className="text-3xl font-bold text-caribbean mb-10 text-center">
        {t("available_pts")}
      </h2>

      <div
        className="relative transition-all duration-300"
        style={{ minHeight: containerHeight || "auto" }}
      >
        <div ref={itemsRef}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500">

            {/* 🔹 Loading Skeletons */}
            {loading &&
              Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                <SkeletonProfessionalCard key={idx} />
              ))}

            {/* 🔹 Real PT Cards */}
            {!loading && currentItems.length > 0 &&
              currentItems.map((pt, index) => (
                <div
                  key={pt._id || index}
                  className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition flex flex-col items-center text-center"
                >
                  <div className="w-60 h-60 rounded-full ring ring-caribbean ring-offset-base-100 ring-offset-2 overflow-hidden">
                    <img
                      src={pt.profileImageUrl || avatar}
                      alt={pt.fullName || t("unnamed_pt")}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.src = avatar)}
                    />
                  </div>

                  <h3 className="font-semibold text-lg text-caribbean mt-4">
                    {pt.fullName || t("unnamed_pt")}
                  </h3>
                  <p className="text-md text-gray-600">
                    {pt.ptProfile?.speciality?.length
                      ? pt.ptProfile.speciality.join(", ")
                      : t("no_speciality_listed")}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {pt.ptProfile?.institution || t("no_institution")}
                  </p>

                  <Link
                    to={`/profile/pt/${pt._id}`}
                    className="btn btn-sm bg-caribbean text-white w-full mt-4 hover:bg-tufts"
                  >
                    {t("view_profile")}
                  </Link>
                </div>
              ))}

            {/* 🔹 Empty State */}
            {!loading && currentItems.length === 0 && (
              <p className="col-span-full text-center text-gray-500">
                {t("no_promotions_available")}
              </p>
            )}

          </div>
        </div>

        {/* Prev/Next Buttons */}
        {totalPages > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white text-caribbean shadow p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowBigLeftIcon size={22} />
            </button>

            <button
              onClick={handleNext}
              className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white text-caribbean shadow p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowBigRightIcon size={22} />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              stopAutoPlay();
              setPage(i);
            }}
            className={`h-3 w-3 rounded-full transition-all ${
              i === page ? "bg-caribbean scale-125" : "bg-gray-300"
            }`}
          ></button>
        ))}
      </div>
    </section>
  );
}