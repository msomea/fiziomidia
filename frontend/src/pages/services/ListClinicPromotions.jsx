import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowBigLeftIcon, ArrowBigRightIcon, MapPin, Star, Clock } from "lucide-react";
import { fetchClinicPromotions } from "../../api/promotions";

const ITEMS_PER_PAGE = 6;
const AUTO_PLAY_INTERVAL = 6000;

export default function ListClinicPromotions() {
  const { t } = useTranslation();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const intervalRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemsRef = useRef(null);

  useEffect(() => {
    const fetchClinicPromotionsData = async () => {
      try {
        const data = await fetchClinicPromotions();
        setPromotions(data || []);
      } catch (err) {
        console.error(t("failed_load_clinic_promotions"), err);
      } finally {
        setLoading(false);
      }
    };
    fetchClinicPromotionsData();
  }, [t]);

  const totalPages = Math.ceil(promotions.length / ITEMS_PER_PAGE);

  useEffect(() => {
    startAutoPlay();

    if (itemsRef.current) {
      const height = itemsRef.current.offsetHeight;
      if (height > containerHeight) setContainerHeight(height);
    }
    return () => stopAutoPlay();
  }, [page, promotions]);

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

  const currentItems = promotions.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );



  return (
    <section className="max-w-7xl mt-4 mx-auto px-4 py-14">
      <h2 className="text-3xl font-bold text-caribbean mb-4 text-center">
        {t("featured_clinic_promotions")}
      </h2>
      <div
        className="relative transition-all duration-300"
        style={{ minHeight: containerHeight || "auto" }}
      >
        <div ref={itemsRef}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">

            {/* Loading Skeletons */}
            {loading &&
              Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))
            }

            {/* Real Clinic Promotion Cards */}
            {!loading && currentItems.length > 0 &&
              currentItems.map((promotion, index) => (
                <div
                  key={promotion._id || index}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Promotion Image */}
                  <div className="h-48 bg-gradient-to-br from-caribbean to-tufts relative overflow-hidden">
                    {promotion.imageUrl ? (
                      <img
                        src={promotion.imageUrl}
                        alt={promotion.customTitle || promotion.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Star className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Promotion Content */}
                  <div className="p-6 text-center">
                    {/* Clinic Name */}
                    <h3 className="font-bold text-lg text-caribbean mb-2">
                      {promotion.clinic?.name || t("unnamed_clinic")}
                    </h3>

                    {/* Custom Title */}
                    {promotion.customTitle ? (
                      <h4 className="font-semibold text-tufts mb-3">
                        {promotion.customTitle}
                      </h4>
                    ) : (
                      <h4 className="font-semibold text-gray-600 mb-3">
                        {t("premium_clinic_promotion")}
                      </h4>
                    )}

                    {/* Custom Description */}
                    {promotion.customDescription && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {promotion.customDescription}
                      </p>
                    )}

                    {/* Clinic Location */}
                    {promotion.clinic?.address && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{promotion.clinic.address}</span>
                      </div>
                    )}

                    {/* Services */}
                    {promotion.clinic?.services && promotion.clinic.services.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap justify-center gap-1">
                          {promotion.clinic.services.slice(0, 3).map((service, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {service}
                            </span>
                          ))}
                          {promotion.clinic.services.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{promotion.clinic.services.length - 3} {t("more")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price and CTA */}
                    <div className="flex items-center justify-center">                      
                      <Link
                        to={`/clinic/${promotion.clinic?._id}`}
                        className="btn bg-caribbean text-white btn-sm hover:bg-tufts"
                      >
                        {t("view_clinic")}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            }

            {/* Empty State */}
            {!loading && currentItems.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {t("no_clinic_promotions_available")}
                </h3>
                <p className="text-gray-500 mb-6">
                  {t("check_back_later_for_promotions")}
                </p>
                <Link
                  to="/services"
                  className="btn bg-caribbean text-white"
                >
                  {t("browse_other_services")}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        {totalPages > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white text-caribbean shadow-lg p-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowBigLeftIcon size={24} />
            </button>

            <button
              onClick={handleNext}
              className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white text-caribbean shadow-lg p-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowBigRightIcon size={24} />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
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
            />
          ))}
        </div>
      )}
    </section>
  );
}
