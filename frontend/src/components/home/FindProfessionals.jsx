import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg"
import { Link } from "react-router";

const FindProfessionals = () => {
  const [pts, setPts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchPTs = async () => {
      try {
        const res = await API.get("/pts/promotions");
        setPts(res.data || []); // safe array handling
      } catch (err) {
        console.error("Failed to load PTs:", err);
      }
    };
    fetchPTs();
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-caribbean mb-8 text-center">
        Find Professionals
      </h2>

      {/* Grid of PT cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pts.length > 0 ? (
          pts.map((pt, index) => (
            <div
              key={pt._id || index}
              className="card bg-white shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4 text-center"
            >
              {/* Avatar */}
              <div className="avatar mx-auto mb-3">
                <div className="w-24 rounded-full ring ring-caribbean ring-offset-base-100 ring-offset-2">
                  <img
                    src={
                      pt.profileImageUrl
                        ? `${API_URL}${pt.profileImageUrl}`
                        : avatar
                    }
                    alt={pt.fullName || "Physiotherapist"}
                    onError={(e) => { e.target.src = avatar; }}       
                  />
                </div>
              </div>

              {/* PT Details */}
              <h3 className="font-semibold text-lg text-black">
                {pt.fullName || "Unnamed PT"}
              </h3>
              <p className="text-sm text-gray-600">
                {pt.ptProfile?.speciality?.length
                  ? pt.ptProfile.speciality.join(", ")
                  : "No specialities listed"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pt.ptProfile?.institution || "No institution listed"}
              </p>

              {/* View Profile Button */}
              <Link 
              to={`/profile/pt/${pt._id}`}
              className="btn btn-sm bg-caribbean text-white mt-3 hover:bg-tufts">
                View Profile
              </Link>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-600">
            No promoted physiotherapists found.
          </p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="btn btn-outline btn-sm bg-gray-200 text-accent border-caribbean border p-1 mx-1 disabled:opacity-50"
        >
          <ArrowBigLeftIcon />
        </button>
        <button
          onClick={() => setPage(page + 1)}
          className="btn btn-sm bg-caribbean text-white p-1 mx-1 hover:bg-tufts"
        >
          <ArrowBigRightIcon />
        </button>
      </div>
    </section>
  );
};

export default FindProfessionals;
