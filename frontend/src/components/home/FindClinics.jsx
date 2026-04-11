import {
  ArrowBigLeftIcon,
  ArrowBigRightIcon,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import avatar from "../../assets/avatar.jpg";
import SkeletonProfessionalCard from "./SkeletonProfessionalCard";
import { formatClinicAddress } from "../../utils/clinicAddressHelper.js";

export default function FindClinics({ promotions = [] }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [paused, setPaused] = useState(false);

  const carouselRef = useRef(null);

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

  const totalPages = Math.ceil(promotions.length / itemsPerPage);

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

  const showSkeletons = promotions.length < 1;


  return (
    <section className="bg-gray-50 py-16 min-h-[25vh] flex items-center">
      <div className="max-w-6xl mx-auto px-4 w-full relative">
        <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
          {t("find_clinics")}
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
              promotions.map((promotion) => (
                <div
                  key={promotion._id}
                  className="flex-shrink-0 w-[85%] sm:w-[300px] bg-white rounded-2xl p-4 shadow hover:shadow-lg transition"
                >
                  <div className="mx-auto mb-4 w-full h-40 object-cover rounded-xl ring ring-caribbean ring-offset-2 overflow-hidden">
                    <img
                      src={
                        promotion.imageUrl || 
                        promotion.clinic?.imageUrl || 
                        avatar
                      }
                      alt={promotion.clinic?.name || "Clinic"}
                      loading="lazy"
                      onError={(e) => (e.target.src = avatar)}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-caribbean" />
                    <h3 className="font-semibold text-caribbean text-lg text-center">
                      {promotion.clinic?.name || t("unnamed_clinic")}
                    </h3>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-1 text-center">
                      {formatClinicAddress(promotion.clinic)}
                    </span>
                  </div>
                  
                  {promotion.customTitle && (
                    <p className="text-sm font-medium text-gray-700 mb-1 text-center">
                      {promotion.customTitle}
                    </p>
                  )}

                  {promotion.customDescription && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3 text-center">
                      {promotion.customDescription}
                    </p>
                  )}

                  <div className="flex justify-center gap-2">                    
                    {promotion.clinic?._id && (
                      <Link
                        to={`/clinic/${promotion.clinic._id}`}
                        className="btn btn-sm bg-caribbean text-white flex-1 hover:bg-tufts text-xs text-center"
                      >
                        {t("view_clinic")}
                      </Link>
                    )}
                  </div>
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
