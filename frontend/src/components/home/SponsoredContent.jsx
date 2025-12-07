import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";

const SponsoredContent = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/sponsored-products");
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        toast.error("Failed to load sponsored products");
      }
    };
    load();
  }, [page]);

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
          Sponsored Content
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="card bg-alice shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4"
            >
              <img
                src={`${API_URL}${product.image}`}
                alt={product.name}
                className="rounded-xl w-full h-40 object-cover"
              />

              <h3 className="text-lg font-semibold text-black mt-3">
                {product.name}
              </h3>

              <p className="text-caribbean font-bold">{product.price}</p>

              <a
                href={product.link}
                target="_blank"
                className="btn btn-sm bg-caribbean text-white mt-3 hover:bg-tufts w-full"
              >
                View Product
              </a>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8 gap-3">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="btn btn-sm bg-gray-200 text-accent disabled:opacity-50"
          >
            <ArrowBigLeftIcon />
          </button>

          <span className="font-bold text-caribbean">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="btn btn-sm bg-caribbean text-white hover:bg-tufts"
          >
            <ArrowBigRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SponsoredContent;
