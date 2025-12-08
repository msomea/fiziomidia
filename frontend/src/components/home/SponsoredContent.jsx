import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";

const SponsoredContent = () => {
  const [products, setProducts] = useState([]);
  const carouselRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/sponsored-products");
        setProducts(res.data.products);
      } catch (err) {
        toast.error("Failed to load sponsored products");
      }
    };
    load();
  }, []);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -300,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: 300,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 relative">
        <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
          Sponsored Content
        </h2>

        {/* Carousel container */}
        <div className="flex items-center relative">
          {/* Left arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 z-10 bg-gray-100 p-2 rounded-full shadow text-caribbean hover:bg-gray-200"
          >
            <ArrowBigLeftIcon />
          </button>

          {/* Scrollable carousel */}
          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-4 scrollbar-hide px-10"
          >
            {products.map((product) => (
              <div
                key={product._id}
                className="min-w-[220px] card bg-alice shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4 flex-shrink-0"
              >
                <img
                  src={`${API_URL}${product.image}`}
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
            className="absolute right-0 z-10 bg-gray-100 p-2 rounded-full text-caribbean shadow hover:bg-gray-200"
          >
            <ArrowBigRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SponsoredContent;
