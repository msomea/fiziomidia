import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";
import { Link } from "react-router";

const ITEMS_PER_PAGE = 5;
const AUTO_PLAY_INTERVAL = 5000; // 5 seconds

export default function FindProfessionals() {
  const [pts, setPts] = useState([]);
  const [page, setPage] = useState(0); // 0-indexed pages
  const intervalRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemsRef = useRef(null);


  useEffect(() => {
    const fetchPTs = async () => {
      try {
        const res = await API.get("/pts/promotions");
        setPts(res.data || []);
      } catch (err) {
        console.error("Failed to load PTs:", err);
      }
    };
    fetchPTs();
  }, []);

  // Total number of pages
  const totalPages = Math.ceil(pts.length / ITEMS_PER_PAGE);

  // Auto-play effect
  useEffect(() => {
    startAutoPlay();
    if (itemsRef.current) {
      const height = itemsRef.current.offsetHeight;
      if (height > containerHeight) {
        setContainerHeight(height);
      }
    }
    return () => stopAutoPlay();
  }, [page, pts]);

  const startAutoPlay = () => {
    stopAutoPlay(); // reset existing interval
    intervalRef.current = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, AUTO_PLAY_INTERVAL);
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
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
        Find Professionals
      </h2>

      {/* Carousel container */}
      <div
        className="relative transition-all duration-300"
        style={{ minHeight: containerHeight || "auto" }}
      >
        {/* Measure height */}
        <div ref={itemsRef}>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 transition-all duration-500">
            {currentItems.length > 0 ? (
              currentItems.map((pt, index) => (

              <div
                key={pt._id || index}
                className="card bg-white shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4 text-center"
              >
                {/* Avatar */}
                <div className="avatar mx-auto mb-3">
                  <div className="w-20 h-20 rounded-full ring ring-caribbean ring-offset-base-100 ring-offset-2 overflow-hidden">
                    <img
                      src={
                        pt.profileImageUrl
                          ? `${API_URL}${pt.profileImageUrl}`
                          : avatar
                      }
                      alt={pt.fullName || "Physiotherapist"}
                      onError={(e) => {
                        e.target.src = avatar;
                      }}
                    />
                  </div>
                </div>

                {/* PT Details */}
                <h3 className="font-semibold text-lg text-black">
                  {pt.fullName || "Unnamed PT"}
                </h3>
                <p className="text-sm text-gray-600">
                  {pt.ptProfile?.speciality?.length
                    ? pt.ptProfile.speciality.join(", ")
                    : "No specialities listed"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {pt.ptProfile?.institution || "No institution listed"}
                </p>

                {/* View Profile */}
                <Link
                  to={`/profile/pt/${pt._id}`}
                  className="btn btn-sm bg-caribbean text-white mt-3 hover:bg-tufts"
                >
                  View Profile
                </Link>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-600">
              No promoted physiotherapists found.
            </p>
          )}
        </div>
      </div>

        {/* Prev Button */}
        <button
          onClick={handlePrev}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white text-caribbean shadow p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowBigLeftIcon size={22} />
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white text-caribbean shadow p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowBigRightIcon size={22} />
        </button>
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
