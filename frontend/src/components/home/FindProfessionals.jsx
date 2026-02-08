import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import {
  ArrowBigLeftIcon,
  ArrowBigRightIcon,
  Loader2,
} from "lucide-react";
import { API_URL, ASSET_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";
import { Link } from "react-router";

const ITEMS_PER_PAGE = 5;
const AUTO_PLAY_INTERVAL = 5000;

export default function FindProfessionals() {
  const [pts, setPts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const intervalRef = useRef(null);
  const itemsRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const fetchPTs = async () => {
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/pts/promotions`);
        setPts(res.data || []);
      } catch (err) {
        console.error("Failed to load PTs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPTs();
  }, []);

  const totalPages = Math.ceil(pts.length / ITEMS_PER_PAGE);
  const hasPagination = totalPages > 1;

  // Auto play
  useEffect(() => {
    if (!hasPagination) return;

    startAutoPlay();

    if (itemsRef.current) {
      const height = itemsRef.current.offsetHeight;
      if (height > containerHeight) {
        setContainerHeight(height);
      }
    }

    return stopAutoPlay;
  }, [page, pts]);

  const startAutoPlay = () => {
    stopAutoPlay();
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 text-caribbean animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && pts.length === 0 && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 text-caribbean animate-spin" />
        </div>
      )}

      {/* Carousel */}
      {!loading && pts.length > 0 && (
        <>
          <div
            className="relative transition-all duration-300"
            style={{ minHeight: containerHeight || "auto" }}
          >
            <div ref={itemsRef}>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {currentItems.map((pt) => (
                  <div
                    key={pt._id}
                    className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4 text-center"
                  >
                    <div className="mx-auto mb-3 w-20 h-20 rounded-full ring ring-caribbean ring-offset-2 overflow-hidden">
                      <img
                        src={
                          pt.profileImageUrl
                            ? `${ASSET_URL}${pt.profileImageUrl}`
                            : avatar
                        }
                        alt={pt.fullName}
                        onError={(e) => (e.target.src = avatar)}
                      />
                    </div>

                    <h3 className="font-semibold text-lg">
                      {pt.fullName || "Unnamed PT"}
                    </h3>

                    <p className="text-sm text-gray-600">
                      {pt.ptProfile?.speciality?.length
                        ? pt.ptProfile.speciality.join(", ")
                        : "No speciality listed"}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {pt.ptProfile?.institution || "No institution"}
                    </p>

                    <Link
                      to={`/profile/pt/${pt._id}`}
                      className="btn btn-sm bg-caribbean text-white mt-3 hover:bg-tufts"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrows */}
            {hasPagination && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute top-1/2 -left-4 -translate-y-1/2 bg-white text-caribbean shadow p-2 rounded-full"
                >
                  <ArrowBigLeftIcon size={22} />
                </button>

                <button
                  onClick={handleNext}
                  className="absolute top-1/2 -right-4 -translate-y-1/2 bg-white text-caribbean shadow p-2 rounded-full"
                >
                  <ArrowBigRightIcon size={22} />
                </button>
              </>
            )}
          </div>

          {/* Pagination dots */}
          {hasPagination && (
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    stopAutoPlay();
                    setPage(i);
                  }}
                  className={`h-3 w-3 rounded-full transition-all ${
                    i === page
                      ? "bg-caribbean scale-125"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
