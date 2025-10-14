import React, { useState, useEffect } from "react";

const SponsoredContent = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Mock data (replace with API call)
    setProducts([
      { id: 1, name: "Therapy Ball Set", price: "$25", image: "/assets/product1.jpg" },
      { id: 2, name: "Resistance Bands", price: "$15", image: "/assets/product2.jpg" },
      { id: 3, name: "Foam Roller", price: "$30", image: "/assets/product3.jpg" },
      { id: 4, name: "Massage Oil", price: "$12", image: "/assets/product4.jpg" },
    ]);
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
              key={product.id}
              className="card bg-alice shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4"
            >
              <img
                src={product.image}
                alt={product.name}
                className="rounded-xl w-full h-40 object-cover"
              />
              <h3 className="text-lg font-semibold text-black mt-3">{product.name}</h3>
              <p className="text-caribbean font-bold">{product.price}</p>
              <button className="btn btn-sm bg-caribbean text-white mt-3 hover:bg-tufts w-full">
                View Product
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn btn-sm bg-black btn-outline p-1 mx-1"
          >
            Prev
          </button>
          <button
            onClick={() => setPage(page + 1)}
            className="btn btn-sm bg-caribbean text-white p-1 mx-1"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default SponsoredContent;
