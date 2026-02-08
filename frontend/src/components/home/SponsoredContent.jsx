import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { API_URL, ASSET_URL } from "../../config/constants";

const SponsoredContent = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const carouselRef = useRef(null);
  const sectionRef = useRef(null);

  /* ---------- Load products ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`${API_URL}/sponsored-products`);
        setProducts(res.data.products);
      } catch (err) {
        toast.error("Failed to load sponsored products");
      }
    };
    load();
  }, []);

  /* ---------- Calculate dynamic height to match parent sections ---------- */
  useEffect(() => {
    const adjustHeight = () => {
      if (sectionRef.current) {
        const vh = window.innerHeight * 0.25;
        sectionRef.current.style.minHeight = `${vh}px`;
      }
    };

    adjustHeight();
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, []);

  /* ---------- Detect number of items per page ---------- */
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

  /* ---------- Auto-scroll every 4 seconds ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      goToPage((page + 1) % totalPages);
    }, 4000);

    return () => clearInterval(interval);
  }, [page, totalPages]);

  /* ---------- Scroll to selected page ---------- */
  const goToPage = (newPage) => {
    if (!carouselRef.current) return;

    const scrollAmount = carouselRef.current.offsetWidth * newPage;

    carouselRef.current.scrollTo({
      left: scrollAmount,
      behavior: "smooth",
    });

    setPage(newPage);
  };

  const scrollLeft = () => {
    goToPage(page === 0 ? totalPages - 1 : page - 1);
  };

  const scrollRight = () => {
    goToPage((page + 1) % totalPages);
  };

  return (
    <section ref={sectionRef} className="bg-white py-16 flex items-center">
      <div className="max-w-6xl mx-auto px-4 relative w-full">
        <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
          Sponsored Content
        </h2>

        {/* Carousel container */}
        <div className="relative flex items-center w-full">
          {/* Left arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 z-20 bg-gray-100 p-2 rounded-full shadow text-caribbean hover:bg-gray-200"
          >
            <ArrowBigLeftIcon />
          </button>

          {/* Scrollable carousel */}
          <div
            ref={carouselRef}
            className="flex overflow-x-hidden gap-4 px-12 scroll-smooth"
            style={{ scrollBehavior: "smooth" }}
          >
            {products.map((product) => (
              <div
                key={product._id}
                className="min-w-[300px] max-w-[300px] bg-alice shadow-md hover:shadow-lg transition rounded-2xl p-4 flex-shrink-0"
              >
                <img
                  src={`${ASSET_URL}${product.image}`}
                  alt={product.name}
                  className="rounded-xl w-full h-40 object-cover"
                />

                <h3 className="text-lg font-semibold text-black mt-3">
                  {product.name}
                </h3>

                <p className="text-caribbean font-bold">Tsh: {product.price}</p>
                <p className="text-sm text-tufts">{product.description}</p>

                <a
                  href={`https://${product.link}`}
                  target="_blank"
                  className="btn btn-sm bg-caribbean text-white mt-3 hover:bg-tufts w-full"
                >
                  View Product
                </a>
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-0 z-20 bg-gray-100 p-2 rounded-full text-caribbean shadow hover:bg-gray-200"
          >
            <ArrowBigRightIcon />
          </button>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center mt-6 gap-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`w-3 h-3 rounded-full transition ${
                i === page ? "bg-caribbean" : "bg-gray-300"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsoredContent;
