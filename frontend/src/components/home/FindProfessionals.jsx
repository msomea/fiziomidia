import {
  ArrowBigLeftIcon,
  ArrowBigRightIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";
import SkeletonProfessionalCard from "./SkeletonProfessionalCard";

export default function FindProfessionals() {
  const [pts, setPts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [paused, setPaused] = useState(false);

  const carouselRef = useRef(null);

  /* ---------- Load promoted PTs ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/pts/promotions`);
        setPts(res.data || []);
      } catch (err) {
        toast.error("Failed to load professionals");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ---------- Responsive items per page ---------- */
  useEffect(() => {
    const calculateItems = () => {
      if (!carouselRef.current) return;

      const width = carouselRef.current.offsetWidth;
      if (width < 500) setItemsPerPage(1);
      else if (width < 900) setItemsPerPage(2);
      else setItemsPerPage(3);
    };

    calculateItems();
    window.addEventListener("resize", calculateItems);
    return () => window.removeEventListener("resize", calculateItems);
  }, []);

  const totalPages = Math.ceil(pts.length / itemsPerPage);

  /* ---------- Scroll helper ---------- */
  const goToPage = (newPage) => {
    if (!carouselRef.current) return;

    const card = carouselRef.current.firstChild;
    if (!card) return;

    const cardWidth = card.offsetWidth;
    const gap = 16; // gap-4
    const scrollX = newPage * itemsPerPage * (cardWidth + gap);

    carouselRef.current.scrollTo({
      left: scrollX,
      behavior: "smooth",
    });

    setPage(newPage);
  };

  const scrollLeft = () =>
    goToPage(page === 0 ? totalPages - 1 : page - 1);

  const scrollRight = () =>
    goToPage((page + 1) % totalPages);

  /* ---------- Auto-scroll ---------- */
  useEffect(() => {
    if (totalPages <= 1 || paused) return;

    const interval = setInterval(() => {
      setPage((prev) => {
        const next = (prev + 1) % totalPages;
        goToPage(next);
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [totalPages, paused]);

  const showSkeletons = loading || pts.length < 1;

  return (
    <section className="bg-white py-16 min-h-[25vh] flex items-center">
      <div className="max-w-6xl mx-auto px-4 w-full relative">
        <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
          Find Professionals
        </h2>

        <div
          className="relative flex items-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Left Arrow */}
          {!showSkeletons && totalPages > 1 && (
            <button
              onClick={scrollLeft}
              aria-label="Previous"
              className="absolute left-0 z-20 bg-gray-100 p-2 rounded-full shadow text-caribbean hover:bg-gray-200"
            >
              <ArrowBigLeftIcon />
            </button>
          )}

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-hidden px-12 w-full scroll-smooth"
          >
            {showSkeletons ? (
              Array.from({ length: itemsPerPage }).map((_, i) => (
                <SkeletonProfessionalCard key={i} />
              ))
            ) : (
              pts.map((pt) => (
                <div
                  key={pt._id}
                  className="flex-shrink-0 w-[85%] sm:w-[300px] bg-alice rounded-2xl p-4 shadow hover:shadow-lg transition text-center"
                >
                  <div className="mx-auto mb-4 w-full h-40 object-cover rounded-xl ring ring-caribbean ring-offset-2 overflow-hidden">
                    <img
                      src={
                        pt.promotion?.imageUrl // first use promotion image
                          ? pt.promotion.imageUrl
                          : pt.profileImageUrl // fallback to PT profile image
                          ? pt.profileImageUrl
                          : avatar // fallback to default
                      }
                      alt={pt.fullName || "PT Profile"}
                      loading="lazy"
                      onError={(e) => (e.target.src = avatar)}
                      className="w-full h-full object-cover"
                    />

                  </div>

                  <h3 className="font-semibold text-caribbean text-lg">
                    {pt.fullName || "Unnamed PT"}
                  </h3>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {pt.ptProfile?.speciality?.length
                      ? pt.ptProfile.speciality.join(", ")
                      : "No speciality listed"}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {pt.ptProfile?.institution || "No institution"}
                  </p>

                  <Link
                    to={`/profile/pt/${pt._id}`}
                    className="btn btn-sm bg-caribbean text-white mt-3 w-full hover:bg-tufts"
                  >
                    View Profile
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Right Arrow */}
          {!showSkeletons && totalPages > 1 && (
            <button
              onClick={scrollRight}
              aria-label="Next"
              className="absolute right-0 z-20 bg-gray-100 p-2 rounded-full shadow text-caribbean hover:bg-gray-200"
            >
              <ArrowBigRightIcon />
            </button>
          )}
        </div>

        {/* Pagination Dots */}
        {!showSkeletons && totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-6">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                className={`w-3 h-3 rounded-full transition ${
                  i === page ? "bg-caribbean" : "bg-gray-300"
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
