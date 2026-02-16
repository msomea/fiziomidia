import {
  ArrowBigLeftIcon,
  ArrowBigRightIcon,
  Loader2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import SkeletonSponsoredCard from "./SkeletonSponsoredCard";

const SponsoredContent = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  const carouselRef = useRef(null);

  /* ---------- Load products ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/sponsored-products`);
        setProducts(res.data.products || []);
      } catch (err) {
        toast.error(t("failed_load_sponsored"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  /* ---------- Detect items per page ---------- */
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

  const totalPages = Math.ceil(products.length / itemsPerPage);

  /* ---------- Scroll helper ---------- */
  const goToPage = (newPage) => {
    if (!carouselRef.current) return;

    const card = carouselRef.current.firstChild;
    if (!card) return;

    const cardWidth = card.offsetWidth;
    const gap = 16; // gap-4 = 16px
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
    }, 4000);

    return () => clearInterval(interval);
  }, [totalPages, paused]);

  return (
    <section className="bg-white py-16 min-h-[25vh] flex items-center">
      <div className="max-w-6xl mx-auto px-4 w-full relative">
        <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
          {t("sponsored_content")}
        </h2>

        <div
          className="relative flex items-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Left Arrow */}
          {!loading && products.length > itemsPerPage && (
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
            {loading || products.length < 1 ? (
              Array.from({ length: itemsPerPage }).map((_, i) => (
              <SkeletonSponsoredCard key={i} />
            ))
          ) : products.length === 0 ? (
            <div className="flex justify-center items-center w-full h-40 text-gray-500">
              {t("no_sponsored_products")}
            </div>
          ) : (
              products.map((product) => (
                <div
                  key={product._id}
                  className="flex-shrink-0 w-[85%] sm:w-[300px] bg-alice rounded-2xl p-4 shadow text-center hover:shadow-lg transition"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="mx-auto mb-4 w-full h-40 object-cover rounded-xl ring ring-caribbean ring-offset-2 overflow-hidden"
                  />

                  <h3 className="text-lg font-semibold text-caribbean mt-3">
                    {product.name}
                  </h3>

                  <p className="text-gray-600 font-bold">
                    Tsh {product.price?.toLocaleString()}
                  </p>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>

                  <a
                    href={
                      product.link?.startsWith("http")
                        ? product.link
                        : `https://${product.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm bg-caribbean text-white mt-3 w-full hover:bg-tufts"
                  >
                    {t("view_product")}
                  </a>
                </div>
              ))
            )}
          </div>

          {/* Right Arrow */}
          {!loading && products.length > itemsPerPage && (
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
        {!loading && totalPages > 1 && (
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
};

export default SponsoredContent;
