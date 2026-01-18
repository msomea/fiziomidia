import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";
import { Link } from "react-router";

const ITEMS_PER_PAGE = 4; // Bigger cards → fewer per page
const AUTO_PLAY_INTERVAL = 6000;

export default function ListPromotions() {
  const [pts, setPts] = useState([]);
  const [page, setPage] = useState(0);
  const intervalRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemsRef = useRef(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await API.get("/pts/promotions");
        setPts(res.data || []);
      } catch (err) {
        console.error("Failed to load promotions:", err);
      }
    };
    fetchPromotions();
  }, []);

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
console.log(pts)
  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <h2 className="text-3xl font-bold text-caribbean mb-10 text-center">
        Available Physiotherapists
      </h2>

      <div
        className="relative transition-all duration-300"
        style={{ minHeight: containerHeight || "auto" }}
      >
        <div ref={itemsRef}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500">

            {currentItems.length > 0 ? (
              currentItems.map((pt, index) => (
                <div
                  key={pt._id || index}
                  className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition flex flex-col items-center text-center"
                >

                  {/* Image */}
                  <div className="w-60 h-60 rounded-full ring ring-caribbean ring-offset-base-100 ring-offset-2 overflow-hidden">
                    <img
                      src={
                        pt.profileImageUrl ? `${API_URL}${pt.profileImageUrl}` : avatar
                      }
                      alt={pt.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.src = avatar)}
                    />
                  </div>

                  {/* PT Details */}
                  <h3 className="font-semibold text-lg text-caribbean">
                    {pt.fullName || "Unnamed PT"}
                  </h3>
                  <p className="text-md text-gray-600">
                    {pt.ptProfile?.speciality?.length
                      ? pt.ptProfile.speciality.join(", ")
                      : "No specialities listed"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {pt.ptProfile?.institution || "No institution listed"}
                  </p>

                  {/* CTA */}
                  <Link
                    to={`/profile/pt/${pt._id}`}
                    className="btn btn-sm bg-caribbean text-white w-full mt-4 hover:bg-tufts"
                  >
                    View Profile
                  </Link>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No promotions available.
              </p>
            )}
          </div>
        </div>

        {/* Prev Button */}
        {totalPages > 1 && (
          <button
            onClick={handlePrev}
            className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white text-caribbean shadow p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowBigLeftIcon size={22} />
          </button>
        )}

        {/* Next Button */}
        {totalPages > 1 && (
          <button
            onClick={handleNext}
            className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white text-caribbean shadow p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowBigRightIcon size={22} />
          </button>
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
