import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import { API_URL } from "../../config/constants";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 4;
const AUTO_PLAY_INTERVAL = 6000;

export default function SponsoredProductList() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const intervalRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemsRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get(`${API_URL}/sponsored-products`);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(t("failed_load_sponsored"), err);
      }
    };
    fetchProducts();
  }, [t]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  useEffect(() => {
    startAutoPlay();
    if (itemsRef.current) {
      const height = itemsRef.current.offsetHeight;
      if (height > containerHeight) setContainerHeight(height);
    }
    return () => stopAutoPlay();
  }, [page, products, containerHeight]);

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

  const currentItems = products.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
    <section className="max-w-7xl mt-4 mx-auto px-4 py-14">
      <h2 className="text-3xl font-bold text-caribbean mb-10 text-center">
        {t("sponsored_products")}
      </h2>

      <div
        className="relative transition-all duration-300"
        style={{ minHeight: containerHeight || "auto" }}
      >
        <div ref={itemsRef}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500">

            {currentItems.length > 0 ? (
              currentItems.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition flex flex-col items-center text-center"
                >
                  <div className="w-56 h-56 rounded-xl overflow-hidden ring ring-caribbean ring-offset-base-100 ring-offset-2 mb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.src = "/assets/avatar.jpg")}
                    />
                  </div>

                  <h3 className="font-semibold text-xl text-caribbean mb-1">
                    {item.name}
                  </h3>

                  <p className="text-lg text-black font-semibold">
                    TZS {item.price}
                  </p>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {item.description || t("no_description")}
                  </p>

                  {item.link && (
                    <a
                      href={`https://${item.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-caribbean text-white w-full mt-4 hover:bg-tufts"
                    >
                      {t("view_product")}
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                {t("no_sponsored_products")}
              </p>
            )}
          </div>
        </div>

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
