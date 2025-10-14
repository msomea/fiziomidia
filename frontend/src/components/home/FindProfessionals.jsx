import React, { useState, useEffect } from "react";

const FindProfessionals = () => {
  const [pts, setPts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Mock data (replace with API call)
    setPts([
      { id: 1, name: "Dr. Jane Mwita", specialization: "Rehabilitation", location: "Dar es Salaam" },
      { id: 2, name: "Dr. Brian Kileo", specialization: "Sports Therapy", location: "Arusha" },
      { id: 3, name: "Dr. Asha Mushi", specialization: "Geriatrics", location: "Dodoma" },
      { id: 4, name: "Dr. Mark Elias", specialization: "Neuro PT", location: "Mwanza" },
      { id: 5, name: "Dr. Anna Joseph", specialization: "Manual Therapy", location: "Morogoro" },
    ]);
  }, [page]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
        Find Professionals
      </h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pts.map((pt) => (
          <div
            key={pt.id}
            className="card bg-white shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4 text-center"
          >
            <div className="avatar mx-auto mb-3">
              <div className="w-24 rounded-full ring ring-caribbean ring-offset-base-100 ring-offset-2">
                <img src={`/assets/pt${pt.id}.jpg`} alt={pt.name} />
              </div>
            </div>
            <h3 className="font-semibold text-lg text-black">{pt.name}</h3>
            <p className="text-sm text-gray-600">{pt.specialization}</p>
            <p className="text-xs text-gray-500 mt-1">{pt.location}</p>
            <button className="btn btn-sm bg-caribbean text-white mt-3 hover:bg-tufts">
              View Profile
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="btn btn-sm bg-black text-white btn-outline p-1 mx-1"
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
    </section>
  );
};

export default FindProfessionals;
